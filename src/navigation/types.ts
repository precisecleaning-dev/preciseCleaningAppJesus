export type RootStackParams = {
    Tabs: undefined;
    JobDetail: { jobId: string };
    Notifications: undefined;
    TaskDetail: { taskId: string };
    TaskForm: { taskId?: string; projectId?: string };
    ProjectDetail: { projectId: string };
    ProjectForm: { projectId?: string };
};

export type TabParams = {
    Home: undefined;
    Tasks: undefined;
    Payroll: undefined;
    Profile: undefined;
};
