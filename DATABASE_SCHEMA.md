# PBL Platform - Supabase Database Schema

```mermaid
erDiagram
    SCHOOLS ||--o{ USER_PROFILES : has
    SCHOOLS ||--o{ GROUPS : has
    
    USER_PROFILES ||--o{ GROUPS : "teaches (teacher_id)"
    USER_PROFILES ||--o{ STUDENTS : "enrolled as"
    USER_PROFILES ||--o{ FEEDBACK : "provides"
    
    GROUPS ||--o{ STUDENTS : contains
    GROUPS ||--o{ PROJECTS : has
    GROUPS ||--o{ GROUP_BADGES : earned
    
    STUDENTS ||--o{ MASTERY_SCORES : has
    STUDENTS ||--o{ SUBMISSIONS : submits
    STUDENTS ||--o{ ACTIVITY_LOGS : generates
    STUDENTS ||--o{ STUDENT_BADGES : earned
    
    PROJECTS ||--o{ PROJECT_PHASES : contains
    PROJECTS ||--o{ PROJECT_RESOURCES : has
    
    PROJECT_PHASES ||--o{ TASKS : contains
    
    TASKS ||--o{ SUBMISSIONS : receives
    TASKS ||--o{ RUBRICS : "graded by"
    
    RUBRICS ||--o{ RUBRIC_CRITERIA : contains
    
    SUBMISSIONS ||--o{ FEEDBACK : receives
    
    BADGES ||--o{ GROUP_BADGES : "awarded to groups"
    BADGES ||--o{ STUDENT_BADGES : "awarded to students"
    
    SCHOOLS {
        uuid id PK
        text name
        timestamptz created_at
    }
    
    USER_PROFILES {
        uuid id PK
        text email UK
        text full_name
        text role "teacher|student|admin"
        uuid school_id FK
        text avatar_url
        timestamptz created_at
    }
    
    GROUPS {
        uuid id PK
        text name
        uuid school_id FK
        uuid teacher_id FK
        text project_status "pending_topic|active"
        int progress "0-100"
        int xp
        timestamptz created_at
    }
    
    STUDENTS {
        uuid id PK
        uuid user_id FK
        uuid group_id FK
        int personal_xp
        timestamptz joined_at
    }
    
    MASTERY_SCORES {
        uuid id PK
        uuid student_id FK
        int math "0-100"
        int science "0-100"
        int creativity "0-100"
        int leadership "0-100"
        decimal average_score "computed"
    }
    
    PROJECTS {
        uuid id PK
        uuid group_id FK
        text topic
        text driving_question
        text description
    }
    
    PROJECT_PHASES {
        uuid id PK
        uuid project_id FK
        text title
        text description
        text status "locked|active|completed"
        timestamptz deadline
        int phase_order
    }
    
    TASKS {
        uuid id PK
        uuid phase_id FK
        text title
        bool completed
        timestamptz deadline
        bool is_overdue
        uuid rubric_id FK
        int task_order
    }
    
    SUBMISSIONS {
        uuid id PK
        uuid task_id FK
        uuid student_id FK
        text type "github|image"
        text url
        text status "pending|approved|rejected|needs_revision"
        timestamptz submitted_at
        timestamptz reviewed_at
        int revision_count
    }
    
    FEEDBACK {
        uuid id PK
        uuid submission_id FK
        uuid teacher_id FK
        text teacher_comment
        int rubric_score
        timestamptz created_at
    }
    
    RUBRICS {
        uuid id PK
        text name
        int max_score
    }
    
    RUBRIC_CRITERIA {
        uuid id PK
        uuid rubric_id FK
        text name
        text description
        int max_points
        int criteria_order
    }
    
    BADGES {
        uuid id PK
        text name UK
        text icon
        text description
        text color
    }
    
    GROUP_BADGES {
        uuid group_id FK
        uuid badge_id FK
        timestamptz earned_at
    }
    
    STUDENT_BADGES {
        uuid student_id FK
        uuid badge_id FK
        timestamptz earned_at
    }
    
    ACTIVITY_LOGS {
        uuid id PK
        uuid student_id FK
        text action "task_started|task_completed|submission_made|phase_unlocked"
        uuid task_id FK
        uuid phase_id FK
        text details
        timestamptz timestamp
    }
    
    PROJECT_RESOURCES {
        uuid id PK
        uuid project_id FK
        text title
        text uri
        int resource_order
    }
```

## Key Relationships

### User Management
- **Schools** contain multiple **User Profiles**
- **User Profiles** can be teachers, students, or admins
- Teachers create and manage **Groups**
- Students belong to **Groups** through the **Students** junction table

### Project Structure
- Each **Group** has one **Project**
- **Projects** contain ordered **Project Phases**
- **Phases** contain ordered **Tasks**
- **Resources** provide reference materials

### Submissions & Grading
- **Students** submit work for **Tasks**
- **Submissions** can have **Feedback** from teachers
- **Tasks** can be graded using **Rubrics** with multiple **Criteria**

### Gamification
- **Badges** can be earned by **Groups** (team achievements)
- **Badges** can be earned by **Students** (individual achievements)
- **Activity Logs** track all student actions for analytics

### Analytics
- **Mastery Scores** track skill development
- **Activity Logs** record every student action
- **Timestamps** enable time-based analytics
- **Progress** and **XP** calculated from task completion

## Security Model

All tables use **Row-Level Security (RLS)**:

- Teachers see only their groups and students
- Students see only their group members
- Submissions protected by role-based policies
- Activity logs visible only to relevant parties

## Indexes

Optimized queries for:
- Group lookups by teacher
- Task/submission searches
- Activity log time-series queries
- Student performance analytics
