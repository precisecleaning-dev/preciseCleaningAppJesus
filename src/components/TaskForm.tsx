import { FolderKanban, Type, Users } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { fmt, t } from '../constants/strings';
import { useCatalogs } from '../context/CatalogsContext';
import { useAssignableUsers } from '../hooks/useAssignableUsers';
import { useAttachments } from '../hooks/useAttachments';
import { useProjects } from '../hooks/useProjects';
import { useTaskWriteActions } from '../hooks/useTaskWriteActions';
import type { AttachmentSource, PickedAttachmentFile } from '../services/attachmentFilesService';
import type { TaskAssignee, TaskComment } from '../types/tasks';
import {
    buildTaskComment,
    hasFormErrors,
    TASK_COMMENT_MAX_LENGTH,
    TASK_TITLE_MAX_LENGTH,
    validateTaskForm,
    type TaskFormErrorReason,
    type TaskFormValues,
} from '../utils/taskWrites';
import AttachmentsSection from './AttachmentsSection';
import DueDateField from './DueDateField';
import MessageThread from './MessageThread';
import OptionPicker from './OptionPicker';
import { styles } from './TaskForm.styles';
import AppText from './ui/AppText';
import BottomActionBar from './ui/BottomActionBar';
import Button from './ui/Button';
import Card from './ui/Card';
import FieldButton from './ui/FieldButton';
import SelectableChip from './ui/SelectableChip';
import FormSection from './ui/FormSection';
import TextField from './ui/TextField';

interface Props {
    initialValues: TaskFormValues;
    editingTaskId?: string;
    onSaved: () => void;
}

const DURATION_SHORTCUTS = [15, 30, 45, 60, 90, 120];
const NO_PROJECT = 'none';

const ERROR_MESSAGES: Record<TaskFormErrorReason, string> = {
    titleRequired: t.taskErrorTitleRequired,
    titleTooLong: t.taskErrorTitleTooLong,
    assigneesRequired: t.taskErrorAssigneesRequired,
    durationInvalid: t.taskErrorDurationInvalid,
    dueTimeInvalid: t.taskErrorDueTimeInvalid,
    dueTimeWithoutDate: t.taskErrorDueTimeWithoutDate,
};

const parseDuration = (text: string): number => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : -1);

const TaskForm = ({ initialValues, editingTaskId, onSaved }: Props) => {
    const { priorities } = useCatalogs();
    const { users: people, status: peopleStatus } = useAssignableUsers(true);
    const { projects } = useProjects(true);
    const { actor, createTask, updateTask } = useTaskWriteActions();
    const { uploadProgress, pickFiles, uploadFiles } = useAttachments();
    const [values, setValues] = useState<TaskFormValues>(initialValues);
    const [durationText, setDurationText] = useState(String(initialValues.durationMinutes));
    const [hasTriedToSave, setTriedToSave] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [isPeoplePickerVisible, setPeoplePickerVisible] = useState(false);
    const [isProjectPickerVisible, setProjectPickerVisible] = useState(false);
    const [draftComments, setDraftComments] = useState<TaskComment[]>([]);
    const [pendingFiles, setPendingFiles] = useState<PickedAttachmentFile[]>([]);
    const [unsentCommentText, setUnsentCommentText] = useState('');

    const errors = hasTriedToSave ? validateTaskForm(values) : {};
    const updateValues = (changes: Partial<TaskFormValues>) => setValues((current) => ({ ...current, ...changes }));

    const peopleOptions = [...people, ...values.assignees.filter((assignee) => !people.some((person) => person.userId === assignee.userId))].map((person) => ({
        value: person.userId,
        label: person.userName,
    }));

    const handlePeopleConfirm = (selectedIds: string[]) => {
        setPeoplePickerVisible(false);
        const knownPeople: TaskAssignee[] = [...values.assignees, ...people];
        const assignees = selectedIds
            .map((userId) => knownPeople.find((person) => person.userId === userId))
            .filter((person): person is TaskAssignee => !!person)
            .map((person) => ({ userId: person.userId, userName: person.userName }));
        updateValues({ assignees });
    };

    const handleDurationChange = (text: string) => {
        setDurationText(text);
        updateValues({ durationMinutes: parseDuration(text) });
    };

    const handleDraftCommentSend = (text: string) => {
        setDraftComments((current) => [...current, buildTaskComment(text, actor, new Date().toISOString())]);
        return Promise.resolve(true);
    };

    const handleAddAttachments = (source: AttachmentSource) => pickFiles(source).then((files) => setPendingFiles((current) => [...current, ...files]));

    const selectedProject = projects.find((project) => project.id === values.projectId);
    const selectedProjectTitle = selectedProject?.title ?? values.projectTitle ?? '';
    const projectOptions = [
        { value: NO_PROJECT, label: t.taskNoProject },
        ...projects
            .filter((project) => project.status === 'active' || project.id === values.projectId)
            .sort((first, second) => first.title.localeCompare(second.title))
            .map((project) => ({ value: project.id, label: project.title })),
    ];

    const handleProjectConfirm = ([projectId]: string[]) => {
        setProjectPickerVisible(false);
        const project = projects.find((candidate) => candidate.id === projectId);
        updateValues(project ? { projectId: project.id, projectTitle: project.title } : { projectId: null, projectTitle: null });
    };

    const handleSavePress = () => {
        setTriedToSave(true);
        if (hasFormErrors(validateTaskForm(values))) return;
        const valuesToSave: TaskFormValues = { ...values, projectTitle: values.projectId ? selectedProjectTitle : null };
        setSaving(true);
        const unsentComments = unsentCommentText.trim() ? [buildTaskComment(unsentCommentText, actor, new Date().toISOString())] : [];
        if (editingTaskId) {
            updateTask(editingTaskId, valuesToSave).then((isUpdated) => {
                setSaving(false);
                if (isUpdated) onSaved();
            });
            return;
        }
        createTask(valuesToSave, [...draftComments, ...unsentComments]).then((newTaskId) => {
            if (!newTaskId) {
                setSaving(false);
                return;
            }
            uploadFiles({ collection: 'user_tasks', id: newTaskId }, pendingFiles).then(() => {
                setSaving(false);
                onSaved();
            });
        });
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
                <FormSection label={t.taskFieldTitle} errorMessage={errors.title && ERROR_MESSAGES[errors.title]}>
                    <TextField
                        icon={Type}
                        value={values.title}
                        onChangeText={(title) => updateValues({ title })}
                        placeholder={t.taskFieldTitlePlaceholder}
                        maxLength={TASK_TITLE_MAX_LENGTH}
                        invalid={!!errors.title}
                        returnKeyType="done"
                    />
                </FormSection>

                <FormSection label={t.taskFieldAssignees} errorMessage={errors.assignees && ERROR_MESSAGES[errors.assignees]}>
                    <View style={styles.fieldRow}>
                        <FieldButton
                            icon={Users}
                            value={values.assignees.map((assignee) => assignee.userName).join(', ')}
                            placeholder={t.taskFieldAssigneesPlaceholder}
                            onPress={() => setPeoplePickerVisible(true)}
                            accessibilityLabel={t.taskFieldAssignees}
                            isInvalid={!!errors.assignees}
                            hasChevron
                            numberOfLines={2}
                        />
                    </View>
                    {peopleStatus === 'error' && (
                        <AppText variant="caption" tone="warning">
                            {t.taskPeopleLoadError}
                        </AppText>
                    )}
                </FormSection>

                <FormSection label={t.taskFieldDue} errorMessage={errors.dueTime && ERROR_MESSAGES[errors.dueTime]}>
                    <DueDateField dueDate={values.dueDate} dueTime={values.dueTime} onChange={updateValues} />
                </FormSection>

                <FormSection label={t.taskFieldDuration} errorMessage={errors.durationMinutes && ERROR_MESSAGES[errors.durationMinutes]}>
                    <View style={styles.choices}>
                        {DURATION_SHORTCUTS.map((minutes) => (
                            <SelectableChip
                                key={minutes}
                                label={fmt(t.taskDurationValue, { minutes })}
                                accent="sky"
                                isSelected={values.durationMinutes === minutes}
                                onPress={() => handleDurationChange(String(minutes))}
                            />
                        ))}
                    </View>
                    <TextField value={durationText} onChangeText={handleDurationChange} keyboardType="number-pad" invalid={!!errors.durationMinutes} maxLength={4} />
                </FormSection>

                <FormSection label={t.taskFieldProject}>
                    <View style={styles.fieldRow}>
                        <FieldButton
                            icon={FolderKanban}
                            value={values.projectId ? selectedProjectTitle : ''}
                            placeholder={t.taskFieldProjectPlaceholder}
                            onPress={() => setProjectPickerVisible(true)}
                            accessibilityLabel={t.taskFieldProject}
                            hasChevron
                        />
                    </View>
                </FormSection>

                <FormSection label={t.taskFieldPriority}>
                    <View style={styles.choices}>
                        <SelectableChip label={t.taskNone} accent="brand" isSelected={values.priorityId === null} onPress={() => updateValues({ priorityId: null })} />
                        {priorities.map((priority) => (
                            <SelectableChip
                                key={priority.id}
                                label={priority.name}
                                color={priority.color}
                                isSelected={values.priorityId === priority.id}
                                onPress={() => updateValues({ priorityId: priority.id })}
                            />
                        ))}
                    </View>
                </FormSection>

                {!editingTaskId && (
                    <Card>
                        <AttachmentsSection
                            attachments={[]}
                            pendingFiles={pendingFiles}
                            pendingNote={t.attachmentsWillUpload}
                            canUpload={!isSaving}
                            canRemove={false}
                            uploadProgress={uploadProgress}
                            onAdd={handleAddAttachments}
                            onRemovePending={(index) => setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                        />
                    </Card>
                )}

                {!editingTaskId && (
                    <Card>
                        <MessageThread
                            title={t.taskComments}
                            messages={draftComments.map((comment, index) => ({
                                key: `${comment.createdAt}-${index}`,
                                text: comment.text,
                                author: comment.userName,
                                at: comment.createdAt,
                                isMine: true,
                                isPending: true,
                            }))}
                            emptyText={t.taskNoComments}
                            placeholder={t.taskWriteComment}
                            pendingLabel={t.taskCommentSavedOnCreate}
                            canWrite
                            onSend={handleDraftCommentSend}
                            onDraftChange={setUnsentCommentText}
                            maxLength={TASK_COMMENT_MAX_LENGTH}
                        />
                    </Card>
                )}
            </ScrollView>

            <BottomActionBar>
                <Button label={editingTaskId ? t.taskSave : t.taskCreate} size="lg" onPress={handleSavePress} loading={isSaving} />
            </BottomActionBar>

            <OptionPicker
                isVisible={isProjectPickerVisible}
                title={t.taskFieldProject}
                options={projectOptions}
                selectedValues={[values.projectId ?? NO_PROJECT]}
                onClose={() => setProjectPickerVisible(false)}
                onConfirm={handleProjectConfirm}
            />

            <OptionPicker
                isVisible={isPeoplePickerVisible}
                title={t.taskFieldAssignees}
                options={peopleOptions}
                selectedValues={values.assignees.map((assignee) => assignee.userId)}
                isMultiple
                isLoading={peopleStatus === 'loading'}
                onClose={() => setPeoplePickerVisible(false)}
                onConfirm={handlePeopleConfirm}
            />
        </KeyboardAvoidingView>
    );
};

export default TaskForm;
