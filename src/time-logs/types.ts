
export interface ITimeLogFilters {
    developerId: number;
    projectId?: number;
    startDate?: Date;
    endDate?: Date;
}

export interface IWhereCondition {
    userId: number;
    startedAt?: {
        gte?: Date;
        lte?: Date
    };
    task?: {
        projectId?: number
    };
}

export interface IResponseGetDeveloperTime {
    timeLogs: {
        id: number
        startedAt: Date
        endedAt: Date | null
        durationMs: number | null
        task: {
            id: number
            title: string
            status: string
            project: {
                id: number
                name: string
            }
        }
        user: {
            id: number
            name: string
        }
    }[];
    stats: {
        totalDurationMs: number
        totalHours: string
        uniqueTasksCount: number
        projectsInvolved: number
    }
}