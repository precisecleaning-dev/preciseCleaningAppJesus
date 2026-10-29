import { UserCheck } from 'lucide-react-native';
import { useState } from 'react';
import { t } from '../constants/strings';
import type { AssignableUser, TaskAssignee } from '../types/tasks';
import OptionPicker, { type PickerOption } from './OptionPicker';
import FieldButton from './ui/FieldButton';

interface Props {
    approver: TaskAssignee | null;
    approvers: AssignableUser[];
    isLoading: boolean;
    canChooseNone?: boolean;
    onChange: (approver: TaskAssignee | null) => void;
}

const NO_APPROVER = 'none';

const ApproverField = ({ approver, approvers, isLoading, canChooseNone = false, onChange }: Props) => {
    const [isPickerVisible, setPickerVisible] = useState(false);
    // The current approver may no longer be in the list (e.g. their role changed): keep them as an option.
    const choices: TaskAssignee[] = approver && !approvers.some((person) => person.userId === approver.userId) ? [approver, ...approvers] : approvers;
    const options: PickerOption[] = [
        ...(canChooseNone ? [{ value: NO_APPROVER, label: t.taskApprovalNotNeeded }] : []),
        ...choices.map((person) => ({ value: person.userId, label: person.userName })),
    ];

    const handleConfirm = ([selectedValue]: string[]) => {
        setPickerVisible(false);
        const chosen = choices.find((person) => person.userId === selectedValue);
        onChange(chosen ? { userId: chosen.userId, userName: chosen.userName } : null);
    };

    return (
        <>
            <FieldButton
                icon={UserCheck}
                value={approver?.userName ?? ''}
                placeholder={canChooseNone ? t.taskApprovalNotNeeded : t.taskApprovalChoose}
                onPress={() => setPickerVisible(true)}
                accessibilityLabel={t.taskApprovalFor}
                hasChevron
            />
            <OptionPicker
                isVisible={isPickerVisible}
                title={t.taskApprovalFor}
                options={options}
                selectedValues={[approver?.userId ?? NO_APPROVER]}
                isLoading={isLoading}
                emptyMessage={t.taskApprovalNoApprovers}
                onClose={() => setPickerVisible(false)}
                onConfirm={handleConfirm}
            />
        </>
    );
};

export default ApproverField;
