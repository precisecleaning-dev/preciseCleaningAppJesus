import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assigneeIdsOf, newlyAssignedUserIds, type TaskDoc } from '../taskEvents';

const openTask = (overrides: Partial<TaskDoc> = {}): TaskDoc => ({
    title: 'Post flyer',
    status: 'open',
    assignees: [{ userId: 'ana', userName: 'Ana' }],
    assigneeUserIds: ['ana'],
    createdByUserId: 'omar',
    ...overrides,
});

test('reads assignees from every format and without repeats', () => {
    assert.deepEqual(assigneeIdsOf({ assignees: [{ userId: 'a' }], assigneeUserIds: ['a', 'b'], assigneeUserId: 'c' }), ['a', 'b', 'c']);
    assert.deepEqual(assigneeIdsOf({ assigneeUserId: 'legacy' }), ['legacy']);
    assert.deepEqual(assigneeIdsOf({ assigneeUserIds: ['', '  '] }), []);
});

test('new task: everyone assigned except the creator', () => {
    assert.deepEqual(
        newlyAssignedUserIds(null, openTask({ assigneeUserIds: ['ana', 'omar', 'luis'] })),
        ['ana', 'omar', 'luis'].filter((id) => id !== 'omar'),
    );
});

test('edit: only the people added', () => {
    const before = openTask({ assigneeUserIds: ['ana'] });
    const after = openTask({ assignees: [{ userId: 'ana' }, { userId: 'luis' }], assigneeUserIds: ['ana', 'luis'] });
    assert.deepEqual(newlyAssignedUserIds(before, after), ['luis']);
});

test('moving from the old single-assignee format is not a new assignment', () => {
    const before: TaskDoc = { status: 'open', assigneeUserId: 'ana', createdByUserId: 'omar' };
    assert.deepEqual(newlyAssignedUserIds(before, openTask()), []);
});

test('no email for unrelated edits, done tasks, deletes or repetitions', () => {
    assert.deepEqual(newlyAssignedUserIds(openTask(), openTask({ title: 'New title' })), []);
    assert.deepEqual(newlyAssignedUserIds(null, openTask({ status: 'done' })), []);
    assert.deepEqual(newlyAssignedUserIds(openTask(), null), []);
    assert.deepEqual(newlyAssignedUserIds(null, openTask({ repeatOfTaskId: 'previous-task' })), []);
});

test('the creator assigning only themselves gets no email', () => {
    assert.deepEqual(newlyAssignedUserIds(null, openTask({ assignees: [{ userId: 'omar' }], assigneeUserIds: ['omar'] })), []);
});
