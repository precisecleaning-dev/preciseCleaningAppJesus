import { Plus, Type, User, Users, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { fmt, t } from '../constants/strings';
import { useCatalogs } from '../context/CatalogsContext';
import { useAssignableUsers } from '../hooks/useAssignableUsers';
import { useProjectWriteActions } from '../hooks/useProjectWriteActions';
import { colors, projectColors } from '../theme/tokens';
import type { TaskAssignee, TaskProjectColor, TaskProjectStatus } from '../types/tasks';
import { PROJECT_STATUS_LABELS } from '../utils/projectVisual';
import { TASK_TITLE_MAX_LENGTH } from '../utils/taskWrites';
import {
    MAX_TASKS_ON_PROJECT_CREATE,
    PROJECT_DESCRIPTION_MAX_LENGTH,
    PROJECT_TITLE_MAX_LENGTH,
    emptyInitialProjectTask,
    validateProjectForm,
    type InitialProjectTask,
    type ProjectFormErrorReason,
    type ProjectFormValues,
} from '../utils/projectWrites';
import DueDateField from './DueDateField';
import OptionPicker from './OptionPicker';
import { styles } from './ProjectForm.styles';
import AppText from './ui/AppText';
import BottomActionBar from './ui/BottomActionBar';
import Button from './ui/Button';
import FieldButton from './ui/FieldButton';
import FormSection from './ui/FormSection';
import SelectableChip from './ui/SelectableChip';
import TextField from './ui/TextField';
import Touchable from './ui/Touchable';

interface Props {
    initialValues: ProjectFormValues;
    editingProjectId?: string;
    onSaved: () => void;
}

const ERROR_MESSAGES: Record<ProjectFormErrorReason, string> = {
    titleRequired: t.projectErrorTitleRequired,
    titleTooLong: t.projectErrorTitleTooLong,
    descriptionTooLong: t.projectErrorDescriptionTooLong,
    ownerRequired: t.projectErrorOwnerRequired,
    dueBeforeStart: t.projectErrorDueBeforeStart,
    tooManyTasks: t.projectErrorTooManyTasks,
};

const COLOR_LABELS: Record<TaskProjectColor, string> = {
    blue: t.projectColorBlue,
    green: t.projectColorGreen,
    amber: t.projectColorAmber,
    purple: t.projectColorPurple,
    pink: t.projectColorPink,
    teal: t.projectColorTeal,
    olive: t.projectColorOlive,
};

const COLOR_IDS = Object.keys(projectColors) as TaskProjectColor[];
const STATUSES: TaskProjectStatus[] = ['active', 'done', 'archived'];

const ProjectForm = ({ initialValues, editingProjectId, onSaved }: Props) => {
    const { teams } = useCatalogs();
    const { users: people, status: peopleStatus } = useAssignableUsers(true);
    const { createProject, updateProject } = useProjectWriteActions();
    const [values, setValues] = useState<ProjectFormValues>(initialValues);
    const [initialTasks, setInitialTasks] = useState<InitialProjectTask[]>([emptyInitialProjectTask()]);
    const [assigningTaskIndex, setAssigningTaskIndex] = useState<number | null>(null);
    const [hasTriedToSave, setTriedToSave] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [isOwnerPickerVisible, setOwnerPickerVisible] = useState(false);

    const isCreating = !editingProjectId;
    const errors = hasTriedToSave ? validateProjectForm(values, isCreating ? initialTasks : []) : {};
    const errorMessageOf = (reason?: ProjectFormErrorReason) => (reason ? ERROR_MESSAGES[reason] : undefined);
    const updateValues = (changes: Partial<ProjectFormValues>) => setValues((current) => ({ ...current, ...changes }));
    const updateInitialTask = (index: number, changes: Partial<InitialProjectTask>) =>
        setInitialTasks((current) => current.map((initialTask, position) => (position === index ? { ...initialTask, ...changes } : initialTask)));
    const removeTaskRow = (index: number) =>
        setInitialTasks((current) => (current.length === 1 ? [emptyInitialProjectTask()] : current.filter((_, position) => position !== index)));
    const ownerName = values.owner?.userName ?? '';
    const assigningTask = assigningTaskIndex === null ? null : initialTasks[assigningTaskIndex];

    const handleTaskAssigneesConfirm = (selectedIds: string[]) => {
        if (assigningTaskIndex !== null) {
            const assignees = selectedIds
                .map((userId) => people.find((person) => person.userId === userId))
                .filter((person): person is TaskAssignee => !!person)
                .map((person) => ({ userId: person.userId, userName: person.userName }));
            updateInitialTask(assigningTaskIndex, { assignees });
        }
        setAssigningTaskIndex(null);
    };

    const handleOwnerConfirm = ([userId]: string[]) => {
        setOwnerPickerVisible(false);
        const person = people.find((candidate) => candidate.userId === userId);
        if (person) updateValues({ owner: person });
    };

    const handleSavePress = () => {
        setTriedToSave(true);
        if (Object.keys(validateProjectForm(values, isCreating ? initialTasks : [])).length > 0) return;
        setSaving(true);
        const save = editingProjectId ? updateProject(editingProjectId, values) : createProject(values, initialTasks);
        save.then((result) => {
            setSaving(false);
            if (result) onSaved();
        });
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
                <FormSection label={t.projectFieldTitle} errorMessage={errorMessageOf(errors.title)}>
                    <TextField
                        icon={Type}
                        value={values.title}
                        onChangeText={(title) => updateValues({ title })}
                        placeholder={t.projectFieldTitlePlaceholder}
                        maxLength={PROJECT_TITLE_MAX_LENGTH}
                        invalid={!!errors.title}
                    />
                </FormSection>

                <FormSection label={t.projectFieldDescription} errorMessage={errorMessageOf(errors.description)}>
                    <TextField
                        value={values.description}
                        onChangeText={(description) => updateValues({ description })}
                        placeholder={t.projectFieldDescriptionPlaceholder}
                        maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
                        multiline
                        style={styles.multilineInput}
                        invalid={!!errors.description}
                    />
                </FormSection>

                <FormSection label={t.projectFieldOwner} errorMessage={errorMessageOf(errors.owner)}>
                    <View style={styles.fieldRow}>
                        <FieldButton
                            icon={User}
                            value={values.owner?.userName ?? ''}
                            placeholder={t.projectFieldOwnerPlaceholder}
                            onPress={() => setOwnerPickerVisible(true)}
                            accessibilityLabel={t.projectFieldOwner}
                            isInvalid={!!errors.owner}
                            hasChevron
                        />
                    </View>
                </FormSection>

                <FormSection label={t.projectFieldTeam}>
                    <View style={styles.choices}>
                        <SelectableChip label={t.taskNone} accent="brand" isSelected={values.teamId === null} onPress={() => updateValues({ teamId: null })} />
                        {teams.map((team) => (
                            <SelectableChip
                                key={team.id}
                                label={team.name}
                                color={team.color}
                                isSelected={values.teamId === team.id}
                                onPress={() => updateValues({ teamId: team.id })}
                            />
                        ))}
                    </View>
                </FormSection>

                <FormSection label={t.projectFieldStart}>
                    <DueDateField
                        dueDate={values.startDate}
                        dueTime=""
                        allowsTime={false}
                        placeholder={t.projectFieldStart}
                        onChange={({ dueDate }) => updateValues({ startDate: dueDate })}
                    />
                </FormSection>

                <FormSection label={t.projectFieldDue} errorMessage={errorMessageOf(errors.dueDate)}>
                    <DueDateField dueDate={values.dueDate} dueTime="" allowsTime={false} placeholder={t.projectFieldDue} onChange={({ dueDate }) => updateValues({ dueDate })} />
                </FormSection>

                <FormSection label={t.projectFieldColor}>
                    <View style={styles.choices}>
                        <SelectableChip label={t.projectColorAuto} accent="brand" isSelected={values.color === null} onPress={() => updateValues({ color: null })} />
                        {COLOR_IDS.map((colorId) => (
                            <SelectableChip
                                key={colorId}
                                label={COLOR_LABELS[colorId]}
                                color={projectColors[colorId]}
                                isSelected={values.color === colorId}
                                onPress={() => updateValues({ color: colorId })}
                            />
                        ))}
                    </View>
                </FormSection>

                {!isCreating && (
                    <FormSection label={t.projectFieldStatus}>
                        <View style={styles.choices}>
                            {STATUSES.map((projectStatus) => (
                                <SelectableChip
                                    key={projectStatus}
                                    label={PROJECT_STATUS_LABELS[projectStatus]}
                                    accent="violet"
                                    isSelected={values.status === projectStatus}
                                    onPress={() => updateValues({ status: projectStatus })}
                                />
                            ))}
                        </View>
                    </FormSection>
                )}

                {isCreating && (
                    <FormSection label={t.projectFieldTasks} hint={t.projectFieldTasksHint} errorMessage={errorMessageOf(errors.tasks)}>
                        {initialTasks.map((initialTask, index) => (
                            <View key={index} style={styles.taskBlock}>
                                <View style={styles.taskRow}>
                                    <View style={styles.flex}>
                                        <TextField
                                            value={initialTask.title}
                                            onChangeText={(title) => updateInitialTask(index, { title })}
                                            placeholder={t.projectTaskPlaceholder}
                                            maxLength={TASK_TITLE_MAX_LENGTH}
                                        />
                                    </View>
                                    <Touchable onPress={() => removeTaskRow(index)} style={styles.removeTaskButton} accessibilityLabel={t.projectRemoveTaskRow}>
                                        <X size={18} color={colors.textMuted} />
                                    </Touchable>
                                </View>
                                <View style={styles.assigneeRow}>
                                    <FieldButton
                                        icon={Users}
                                        value={initialTask.assignees.map((assignee) => assignee.userName).join(', ')}
                                        placeholder={ownerName ? fmt(t.projectTaskAssigneeDefault, { name: ownerName }) : t.taskFieldAssigneesPlaceholder}
                                        onPress={() => setAssigningTaskIndex(index)}
                                        accessibilityLabel={t.taskFieldAssignees}
                                        hasChevron
                                    />
                                </View>
                            </View>
                        ))}
                        {initialTasks.length < MAX_TASKS_ON_PROJECT_CREATE && (
                            <Button
                                label={t.projectAddTaskRow}
                                variant="ghost"
                                size="sm"
                                onPress={() => setInitialTasks((current) => [...current, emptyInitialProjectTask()])}
                                icon={<Plus size={16} color={colors.primary} />}
                            />
                        )}
                    </FormSection>
                )}

                {peopleStatus === 'error' && (
                    <AppText variant="caption" tone="warning">
                        {t.taskPeopleLoadError}
                    </AppText>
                )}
            </ScrollView>

            <BottomActionBar>
                <Button label={isCreating ? t.projectCreate : t.projectSave} size="lg" onPress={handleSavePress} loading={isSaving} />
            </BottomActionBar>

            <OptionPicker
                isVisible={assigningTask !== null}
                title={t.taskFieldAssignees}
                options={people.map((person) => ({ value: person.userId, label: person.userName }))}
                selectedValues={assigningTask?.assignees.map((assignee) => assignee.userId) ?? []}
                isMultiple
                isLoading={peopleStatus === 'loading'}
                onClose={() => setAssigningTaskIndex(null)}
                onConfirm={handleTaskAssigneesConfirm}
            />

            <OptionPicker
                isVisible={isOwnerPickerVisible}
                title={t.projectFieldOwner}
                options={people.map((person) => ({ value: person.userId, label: person.userName }))}
                selectedValues={values.owner ? [values.owner.userId] : []}
                isLoading={peopleStatus === 'loading'}
                onClose={() => setOwnerPickerVisible(false)}
                onConfirm={handleOwnerConfirm}
            />
        </KeyboardAvoidingView>
    );
};

export default ProjectForm;
