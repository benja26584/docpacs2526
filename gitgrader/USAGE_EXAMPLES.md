# GitHub Grading Bot - Usage Examples

## Example 1: Grading a Class Project

### Scenario
You have a class of 5 students working on a project repository. Each student needs to:
- Create an issue for their assigned task
- Commit code to address the issue
- Create a pull request
- Get the PR reviewed and merged
- Move the issue through the project board

### Setup

1. **Create a Project Board** on GitHub:
   - Go to your repository → Projects tab
   - Create a new project with columns: "To Do", "In Progress", "Done"

2. **Students create issues**:
   - Each student creates an issue describing their task
   - Assigns it to themselves
   - Adds it to the project board in "To Do" column

3. **Add Team in GitGrader**:
```
Team Name: Web Dev 101 - Fall 2024
Repository URL: https://github.com/school/student-project
Project Board: 1
Usernames: alice_dev, bob_codes, charlie_git, diana_tech, evan_prog
```

### Grading

Click "Grade" on the team card. The bot will:

1. ✅ Check if each student assigned themselves an issue
2. ✅ Verify commits were made referencing the issues
3. ✅ Confirm PRs were created
4. ✅ Use AI to analyze if the PR actually solves the issue
5. ✅ Check if PRs were merged and issues closed
6. ✅ Verify issues moved through the project board workflow

### Expected Results

**Alice (92/100 - A)**
- Issue Assigned: 10/10 ✓
- Commits Made: 20/20 ✓
- PR Created: 20/20 ✓
- Issue Completed: 30/30 ✓ (AI verified)
- PR Merged: 10/10 ✓
- Project Board: 2/10 ✗ (Only moved to "In Progress", not "Done")

**Bob (100/100 - A)**
- All criteria: ✓ Perfect score!

## Example 2: Quick Manual Grade

### Scenario
You need to quickly grade a single student or test the bot without saving team data.

### Steps

1. Go to the **Grade** tab
2. Use the "Quick Grade (Manual Input)" section
3. Fill in:
```
Repository URL: https://github.com/teacher/homework-repo
Project Board: 2
Usernames: student1, student2
```
4. Click "Start Grading"

This is useful for:
- One-time grading
- Testing the bot
- Different repo/project combinations

## Example 3: Multiple Teams with Same Repository

### Scenario
You have multiple teams working on the same repository but different project boards.

### Setup

**Team Alpha:**
```
Team Name: Team Alpha - Sprint 1
Repository URL: https://github.com/school/shared-project
Project Board: 1
Usernames: alice, bob, charlie
```

**Team Beta:**
```
Team Name: Team Beta - Sprint 1
Repository URL: https://github.com/school/shared-project
Project Board: 2
Usernames: diana, evan, frank
```

Each team has their own project board in the same repository.

## Example 4: Re-grading After Improvements

### Scenario
A student initially failed some criteria and you want to re-grade after they fix their work.

### Steps

1. Student makes improvements:
   - Adds better commit messages
   - Updates PR description
   - Moves issue through workflow

2. In GitGrader:
   - Go to **Teams** tab
   - Find the team
   - Click **"Grade"** button
   - New results will show improvements

3. Compare results:
   - Check "Last Graded" date to see previous grading
   - Export both reports for comparison

## Example 5: Exporting Reports for Records

### Scenario
You need to keep permanent records of student grades.

### Steps

1. After grading, go to **Results** tab
2. Click **"Export HTML Report"**
3. Save the file with a meaningful name: `team-alpha-sprint1-2024-11-04.html`

### Benefits of HTML Export

- **Offline viewing**: Can be opened without the server running
- **Professional formatting**: Clean, printable layout
- **Complete data**: Includes all criteria, feedback, and statistics
- **Permanent record**: Won't change if you re-grade the team

### Storage Recommendation

Create a folder structure:
```
grading-reports/
├── 2024-fall/
│   ├── team-alpha/
│   │   ├── sprint1-2024-09-15.html
│   │   ├── sprint2-2024-10-01.html
│   │   └── final-2024-11-15.html
│   └── team-beta/
│       ├── sprint1-2024-09-15.html
│       └── sprint2-2024-10-01.html
```

## Example 6: Custom Rubric Configuration

### Scenario
You want to weight AI verification less and project board workflow more.

### Steps

1. Edit `config.json`:
```json
{
  "rubric": {
    "issueAssigned": 10,
    "commitsMade": 25,
    "prCreated": 20,
    "issueCompleted": 20,
    "prMerged": 10,
    "projectBoardWorkflow": 15
  },
  "projectBoardColumns": {
    "todo": "To Do",
    "inProgress": "In Progress",
    "done": "Done"
  },
  "aiProvider": "openai"
}
```

2. Restart the server:
```bash
npm start
```

3. New gradings will use the updated rubric

### Rubric Customization Ideas

**Emphasize Code Quality:**
```json
{
  "issueAssigned": 5,
  "commitsMade": 25,
  "prCreated": 15,
  "issueCompleted": 40,
  "prMerged": 10,
  "projectBoardWorkflow": 5
}
```

**Emphasize Process:**
```json
{
  "issueAssigned": 15,
  "commitsMade": 20,
  "prCreated": 20,
  "issueCompleted": 20,
  "prMerged": 10,
  "projectBoardWorkflow": 15
}
```

## Example 7: Handling Common Issues

### Issue: Student didn't reference issue in commits

**Problem:** Student made commits but didn't use `#issue_number`

**Solution:**
- Teach students to use commit messages like:
  - "Add login feature #42"
  - "Fix bug #15"
  - "Implement feature closes #23"

### Issue: PR not linked to issue

**Problem:** Student created PR but it's not connected to their issue

**Solution:**
- Use keywords in PR description:
  - "Closes #42"
  - "Fixes #15"
  - "Resolves #23"
- Or manually link PR to issue in GitHub

### Issue: Project board not updated

**Problem:** Student completed work but didn't move issue cards

**Solution:**
- Teach students to drag issues between columns as they work
- Or use GitHub automation to move cards when PRs are merged

## Example 8: API Rate Limiting

### Scenario
Grading many students triggers GitHub API rate limits.

### Symptoms
- Grading takes very long
- Error messages about rate limits
- Some data missing

### Solutions

1. **Grade in smaller batches:**
   - Create separate teams with fewer students
   - Grade teams one at a time with breaks

2. **Use authenticated token:**
   - Make sure `GITHUB_TOKEN` is set correctly
   - Authenticated requests have higher rate limits (5000/hour vs 60/hour)

3. **Wait between gradings:**
   - GitHub API rate limits reset hourly
   - Check remaining rate limit at: https://api.github.com/rate_limit

## Example 9: Sharing Results with Students

### Option 1: Export and Email
1. Grade the team
2. Export HTML report
3. Email the file to students

### Option 2: Screen Share
1. Run grading during class
2. Share screen showing live results
3. Discuss criteria and improvements

### Option 3: Individual Reports
1. Create separate teams for each student
2. Grade individually
3. Export personal reports

## Tips for Effective Grading

1. **Set Clear Expectations**
   - Share the rubric with students beforehand
   - Explain each criterion
   - Show examples of good practices

2. **Grade Regularly**
   - Don't wait until the end of the project
   - Weekly or bi-weekly gradings help students improve
   - Track progress over time

3. **Use Results for Teaching**
   - Common failures indicate teaching opportunities
   - Share successful examples with the class
   - Adjust rubric based on learning goals

4. **Combine with Manual Review**
   - Use the bot for objective criteria
   - Add manual review for code quality, creativity, etc.
   - Bot saves time on tedious checks

5. **Keep Records**
   - Export HTML reports regularly
   - Document any manual adjustments
   - Track improvement over sprints

## Troubleshooting Common Scenarios

### All Students Score 0
- Check that students actually assigned issues to themselves
- Verify repository URL is correct
- Ensure project board number is correct

### AI Analysis Always Fails
- Check OpenAI API key is valid
- Verify you have credits in your OpenAI account
- Check internet connection
- Look for error messages in terminal

### Project Board Workflow Always Fails
- Verify column names match config.json
- Check that issues were actually added to the project board
- Ensure students moved cards between columns

### Different Results When Re-grading
- Students may have made changes
- GitHub data may have been updated
- Check timestamps on issues, PRs, and commits

