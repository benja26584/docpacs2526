# GitHub Grading Bot - API Documentation

This document describes the REST API endpoints available in the GitHub Grading Bot.

## Base URL

```
http://localhost:3000
```

(Change port if configured differently in `.env`)

## Authentication

Currently, no authentication is required for API endpoints. The bot uses the GitHub token and OpenAI key from environment variables for external API calls.

## Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

---

## Team Management Endpoints

### List All Teams

**GET** `/api/teams`

Returns all saved teams.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4e5f6g7h8",
      "name": "Team Alpha",
      "repoUrl": "https://github.com/owner/repo",
      "projectBoard": "1",
      "usernames": ["student1", "student2", "student3"],
      "createdAt": "2024-11-04T12:00:00.000Z",
      "updatedAt": "2024-11-04T12:00:00.000Z",
      "lastGradingDate": null,
      "lastGradingResults": null
    }
  ]
}
```

---

### Get Single Team

**GET** `/api/teams/:id`

Returns details for a specific team.

**Parameters:**
- `id` (path) - Team ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4e5f6g7h8",
    "name": "Team Alpha",
    "repoUrl": "https://github.com/owner/repo",
    "projectBoard": "1",
    "usernames": ["student1", "student2"],
    "createdAt": "2024-11-04T12:00:00.000Z",
    "updatedAt": "2024-11-04T12:00:00.000Z",
    "lastGradingDate": "2024-11-04T13:00:00.000Z",
    "lastGradingResults": { ... }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Team not found"
}
```

---

### Create Team

**POST** `/api/teams`

Creates a new team.

**Request Body:**
```json
{
  "name": "Team Alpha",
  "repoUrl": "https://github.com/owner/repo",
  "projectBoard": "1",
  "usernames": "student1, student2, student3"
}
```

**Notes:**
- `usernames` can be comma-separated string or array
- `projectBoard` can be a number or GitHub project URL

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4e5f6g7h8",
    "name": "Team Alpha",
    "repoUrl": "https://github.com/owner/repo",
    "projectBoard": "1",
    "usernames": ["student1", "student2", "student3"],
    "createdAt": "2024-11-04T12:00:00.000Z",
    "updatedAt": "2024-11-04T12:00:00.000Z",
    "lastGradingDate": null,
    "lastGradingResults": null
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid team data",
  "details": [
    "Team name is required",
    "Valid GitHub repository URL is required"
  ]
}
```

---

### Update Team

**PUT** `/api/teams/:id`

Updates an existing team.

**Parameters:**
- `id` (path) - Team ID

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "repoUrl": "https://github.com/owner/new-repo",
  "projectBoard": "2",
  "usernames": "student1, student2, student3, student4"
}
```

**Notes:**
- All fields are optional
- Only provided fields will be updated
- `id`, `createdAt` cannot be changed

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4e5f6g7h8",
    "name": "Updated Team Name",
    "repoUrl": "https://github.com/owner/new-repo",
    "projectBoard": "2",
    "usernames": ["student1", "student2", "student3", "student4"],
    "createdAt": "2024-11-04T12:00:00.000Z",
    "updatedAt": "2024-11-04T14:00:00.000Z",
    "lastGradingDate": null,
    "lastGradingResults": null
  }
}
```

---

### Delete Team

**DELETE** `/api/teams/:id`

Deletes a team.

**Parameters:**
- `id` (path) - Team ID

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Team deleted successfully"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Failed to delete team",
  "details": "Team with ID xyz not found"
}
```

---

## Grading Endpoints

### Grade Team

**POST** `/grade`

Performs grading on a team (saved or manual).

**Request Body (Saved Team):**
```json
{
  "teamId": "a1b2c3d4e5f6g7h8"
}
```

**Request Body (Manual):**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "projectBoard": "1",
  "usernames": "student1, student2",
  "teamName": "Quick Grade"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": {
      "repository": "owner/repo",
      "projectBoard": 1,
      "gradedAt": "2024-11-04T14:00:00.000Z",
      "students": [
        {
          "username": "student1",
          "totalScore": 85,
          "maxScore": 100,
          "percentage": "85.0",
          "letterGrade": "B",
          "criteria": {
            "issueAssigned": {
              "name": "Issue Assigned",
              "points": 10,
              "maxPoints": 10,
              "passed": true,
              "feedback": "✓ Student assigned 2 issue(s) to themselves",
              "details": { "issueCount": 2 }
            },
            "commitsMade": {
              "name": "Commits Made",
              "points": 20,
              "maxPoints": 20,
              "passed": true,
              "feedback": "✓ Student made 5 commit(s) referencing their issues",
              "details": {
                "totalCommits": 5,
                "issuesWithCommits": [
                  { "issue": 42, "commits": 3 },
                  { "issue": 43, "commits": 2 }
                ]
              }
            },
            "prCreated": {
              "name": "Pull Request Created",
              "points": 20,
              "maxPoints": 20,
              "passed": true,
              "feedback": "✓ Student created 2 pull request(s) for their issues"
            },
            "issueCompleted": {
              "name": "Issue Completed (AI Verified)",
              "points": 30,
              "maxPoints": 30,
              "passed": true,
              "feedback": "✓ AI verified that 2 of 2 issue(s) were properly completed",
              "details": {
                "analyses": [
                  {
                    "issue": 42,
                    "pr": 15,
                    "passed": true,
                    "confidence": 0.95,
                    "explanation": "The PR successfully implements the login feature..."
                  }
                ],
                "passedCount": 2,
                "totalIssues": 2
              }
            },
            "prMerged": {
              "name": "Pull Request Merged",
              "points": 0,
              "maxPoints": 10,
              "passed": false,
              "feedback": "✗ Pull requests were not merged or issues remain open"
            },
            "projectBoardWorkflow": {
              "name": "Project Board Workflow",
              "points": 5,
              "maxPoints": 10,
              "passed": true,
              "feedback": "✓ 1 of 2 issue(s) moved through the complete workflow"
            }
          },
          "issues": [
            {
              "number": 42,
              "title": "Implement login feature",
              "state": "open",
              "url": "https://github.com/owner/repo/issues/42"
            }
          ],
          "feedback": [
            "✓ Student assigned 2 issue(s) to themselves",
            "✓ Student made 5 commit(s) referencing their issues",
            "..."
          ]
        }
      ],
      "statistics": {
        "averageScore": "82.5",
        "highestScore": 95,
        "lowestScore": 70,
        "passingCount": 2,
        "passingRate": "100.0",
        "totalStudents": 2
      }
    },
    "teamId": "a1b2c3d4e5f6g7h8",
    "teamName": "Team Alpha"
  }
}
```

**Notes:**
- This endpoint can take several minutes depending on the number of students
- Results are automatically saved for teams with `teamId`

**Error Response (400):**
```json
{
  "success": false,
  "error": "Missing required fields: repoUrl, projectBoard, usernames"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Grading failed",
  "details": "Invalid GitHub repository URL"
}
```

---

### Export HTML Report

**POST** `/export`

Generates a standalone HTML report file.

**Request Body:**
```json
{
  "results": { ... },
  "teamName": "Team Alpha"
}
```

**Notes:**
- `results` should be the results object from `/grade` endpoint
- `teamName` is optional (defaults to "Team")

**Response:**
- Content-Type: `text/html`
- Content-Disposition: `attachment; filename="grading-report-{timestamp}.html"`
- Body: HTML file content

**Error Response (400):**
```json
{
  "success": false,
  "error": "Results data is required"
}
```

---

## Configuration Endpoint

### Get Configuration

**GET** `/api/config`

Returns current rubric and configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "rubric": {
      "issueAssigned": 10,
      "commitsMade": 20,
      "prCreated": 20,
      "issueCompleted": 30,
      "prMerged": 10,
      "projectBoardWorkflow": 10
    },
    "projectBoardColumns": {
      "todo": "To Do",
      "inProgress": "In Progress",
      "done": "Done"
    },
    "aiProvider": "openai"
  }
}
```

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created (team) |
| 400 | Bad Request (invalid data) |
| 404 | Not Found (team not found) |
| 500 | Internal Server Error |

---

## Rate Limiting

The bot uses GitHub's API which has rate limits:

- **Authenticated requests**: 5,000 requests per hour
- **Unauthenticated requests**: 60 requests per hour

Make sure to set `GITHUB_TOKEN` in `.env` for higher limits.

---

## Example Usage with cURL

### Create a team
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Alpha",
    "repoUrl": "https://github.com/owner/repo",
    "projectBoard": "1",
    "usernames": "student1, student2"
  }'
```

### Grade a team
```bash
curl -X POST http://localhost:3000/grade \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "a1b2c3d4e5f6g7h8"
  }'
```

### Get all teams
```bash
curl http://localhost:3000/api/teams
```

### Delete a team
```bash
curl -X DELETE http://localhost:3000/api/teams/a1b2c3d4e5f6g7h8
```

---

## Example Usage with JavaScript/Fetch

### Create a team
```javascript
const response = await fetch('http://localhost:3000/api/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Team Alpha',
    repoUrl: 'https://github.com/owner/repo',
    projectBoard: '1',
    usernames: 'student1, student2'
  })
});

const data = await response.json();
console.log(data);
```

### Grade a team
```javascript
const response = await fetch('http://localhost:3000/grade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teamId: 'a1b2c3d4e5f6g7h8'
  })
});

const data = await response.json();
console.log(data.data.results);
```

---

## Webhooks (Future Enhancement)

Currently, the bot does not support webhooks. This feature could be added to automatically grade when:
- Issues are closed
- Pull requests are merged
- Project board cards are moved

---

## Data Storage

- **Teams**: Stored in `data/teams.json`
- **Format**: JSON array of team objects
- **Backup**: Recommended to backup `data/teams.json` regularly

Example `teams.json`:
```json
[
  {
    "id": "a1b2c3d4e5f6g7h8",
    "name": "Team Alpha",
    "repoUrl": "https://github.com/owner/repo",
    "projectBoard": "1",
    "usernames": ["student1", "student2"],
    "createdAt": "2024-11-04T12:00:00.000Z",
    "updatedAt": "2024-11-04T12:00:00.000Z",
    "lastGradingDate": "2024-11-04T13:00:00.000Z",
    "lastGradingResults": { ... }
  }
]
```

