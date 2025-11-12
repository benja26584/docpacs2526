# AI Analysis - How It Works

## Overview

The "Issue Completed" criterion (worth **30 points**, the highest point value) uses AI to verify that a student's pull request actually solves the issue they claimed to work on. This document explains how the AI analysis works and what it looks at.

## What the AI Analyzes

### Primary Focus: Actual Code Changes

The AI **primarily analyzes the actual code changes** (the diff) in the pull request. It does NOT just compare descriptions.

**What the AI receives:**
1. **Issue Title** - The name of the issue
2. **Issue Body** - The detailed description of what needs to be done
3. **PR Title** - The name of the pull request
4. **PR Body** - The PR description
5. **PR Diff** - **MOST IMPORTANT** - The actual code changes (what files were modified, what lines were added/removed/changed)

### Analysis Process

1. **Code Examination**: The AI reads the diff to understand what code was actually modified
2. **File Identification**: It identifies which files were changed
3. **Change Nature**: It determines what kind of changes were made (e.g., CSS styling, JavaScript logic, HTML structure)
4. **Issue Comparison**: It compares the nature of the code changes against what the issue requested
5. **Relevance Check**: It verifies that the code changes are directly relevant to solving the issue
6. **Scope Verification**: It checks if the scope of changes is appropriate

### AI Prompt Strategy

The AI is explicitly instructed to:
- ✅ **Focus on the actual code diff**, not just descriptions
- ✅ Look at what files were modified
- ✅ Examine what code was added, removed, or changed
- ✅ Determine if those specific modifications address the issue
- ✅ Fail PRs where the code changes don't match the issue requirements

The AI is explicitly told to:
- ❌ **NOT** rely solely on comparing text descriptions
- ❌ **NOT** pass PRs based on good descriptions if the code doesn't match
- ❌ **NOT** accept irrelevant code changes

## Examples

### Example 1: PASS - Good Code Alignment

**Issue:**
- Title: "Fix navigation menu not appearing on mobile"
- Body: "The navigation menu is not visible on screens smaller than 768px. Need to add mobile-friendly styles."

**PR Diff (what the AI sees):**
```diff
diff --git a/styles/navigation.css b/styles/navigation.css
--- a/styles/navigation.css
+++ b/styles/navigation.css
@@ -15,6 +15,14 @@
   display: flex;
   justify-content: space-between;
 }
+
+@media (max-width: 768px) {
+  .nav-menu {
+    display: block;
+    width: 100%;
+  }
+}
```

**AI Analysis:**
- ✅ **PASSED** (confidence: 90%)
- Explanation: "The code changes directly address the issue. The developer added mobile-responsive CSS media queries targeting screens below 768px and modified the navigation menu display properties, which will make the menu visible on mobile devices as requested."

### Example 2: FAIL - Irrelevant Changes

**Issue:**
- Title: "Fix navigation menu not appearing on mobile"
- Body: "The navigation menu is not visible on screens smaller than 768px. Need to add mobile-friendly styles."

**PR Diff (what the AI sees):**
```diff
diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1,3 +1,4 @@
 # My Project
+Updated documentation
 
diff --git a/components/Footer.jsx b/components/Footer.jsx
--- a/components/Footer.jsx
+++ b/components/Footer.jsx
@@ -5,7 +5,7 @@
   return (
     <footer>
-      <p>Copyright 2024</p>
+      <p>Copyright 2025</p>
     </footer>
   );
```

**AI Analysis:**
- ❌ **FAILED** (confidence: 95%)
- Explanation: "The code changes do not address the issue. The issue requires fixing the navigation menu visibility on mobile devices, but the actual changes made were to README.md and the footer copyright year. No CSS or navigation-related code was modified."

### Example 3: FAIL - Partial/Insufficient Work

**Issue:**
- Title: "Implement user login functionality"
- Body: "Create a login form with email and password fields. Validate credentials against the database and create a user session."

**PR Diff (what the AI sees):**
```diff
diff --git a/components/LoginForm.jsx b/components/LoginForm.jsx
--- /dev/null
+++ b/components/LoginForm.jsx
@@ -0,0 +1,10 @@
+export default function LoginForm() {
+  return (
+    <form>
+      <input type="email" placeholder="Email" />
+      <input type="password" placeholder="Password" />
+      <button>Login</button>
+    </form>
+  );
+}
```

**AI Analysis:**
- ❌ **FAILED** (confidence: 75%)
- Explanation: "The code changes only partially address the issue. While a login form component was created with email and password fields, the issue specifically requires credential validation against a database and session creation. No authentication logic, database queries, or session management code is present in the diff."

### Example 4: PASS - Complete Implementation

**Issue:**
- Title: "Implement user login functionality"
- Body: "Create a login form with email and password fields. Validate credentials against the database and create a user session."

**PR Diff (what the AI sees):**
```diff
diff --git a/components/LoginForm.jsx b/components/LoginForm.jsx
--- /dev/null
+++ b/components/LoginForm.jsx
@@ -0,0 +1,25 @@
+import { useState } from 'react';
+import { authenticateUser } from '../services/auth';
+
+export default function LoginForm() {
+  const [email, setEmail] = useState('');
+  const [password, setPassword] = useState('');
+
+  const handleSubmit = async (e) => {
+    e.preventDefault();
+    try {
+      await authenticateUser(email, password);
+      // Session created by authenticateUser
+    } catch (error) {
+      alert('Login failed');
+    }
+  };
+
+  return (
+    <form onSubmit={handleSubmit}>
+      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
+      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
+      <button type="submit">Login</button>
+    </form>
+  );
+}

diff --git a/services/auth.js b/services/auth.js
--- /dev/null
+++ b/services/auth.js
@@ -0,0 +1,20 @@
+import { db } from './database';
+import { createSession } from './session';
+
+export async function authenticateUser(email, password) {
+  const user = await db.users.findOne({ email });
+  
+  if (!user) {
+    throw new Error('User not found');
+  }
+  
+  const isValid = await comparePassword(password, user.passwordHash);
+  
+  if (!isValid) {
+    throw new Error('Invalid password');
+  }
+  
+  await createSession(user.id);
+  return user;
+}
```

**AI Analysis:**
- ✅ **PASSED** (confidence: 95%)
- Explanation: "The code changes fully address the issue requirements. The developer created a login form with email and password fields, implemented authentication logic that validates credentials against a database, and includes session creation. The implementation covers all aspects mentioned in the issue."

## Technical Details

### Model Used
- **OpenAI GPT-4o-mini** (configurable in `config.json`)
- Temperature: 0.3 (for consistent, deterministic results)
- Max tokens: 500 (sufficient for analysis response)
- JSON response format (for reliable parsing)

### Diff Size Limit
- Maximum diff size: **4000 characters**
- If a PR diff is longer, it's truncated with a note
- This prevents token limit issues while still capturing most changes

### Empty Diff Handling
- If a PR has no code changes (empty diff), the analysis automatically **FAILS**
- Explanation: "PR diff is empty - no code changes to analyze"
- This prevents students from creating "description-only" PRs

### Confidence Scoring
- The AI provides a confidence score from 0.0 to 1.0
- Higher confidence means the AI is more certain about its decision
- Displayed in the HTML report and console output

## Console Output

When grading, you'll see detailed logs:

```
   🤖 Analyzing PR #123 with AI...
      Issue: "Fix navigation menu not appearing on mobile"
      PR: "Add mobile responsive styles"
      Diff size: 2847 characters
      Files changed: 2
         - styles/navigation.css
         - styles/mobile.css
      🔍 Sending to AI for code analysis...
      AI Result: ✓ PASSED (confidence: 90%)
      Explanation: The code changes directly address the issue by adding mobile-responsive CSS...
```

## Why This Approach?

### Prevents "Gaming" the System
Students cannot pass this criterion by:
- Writing good descriptions without making relevant code changes
- Making minimal/cosmetic changes unrelated to the issue
- Copy-pasting the issue description into the PR description

### Ensures Real Learning
Students must:
- Actually understand the issue
- Make meaningful code modifications
- Solve the actual problem, not just describe it

### Provides Objective Assessment
The AI analyzes concrete code changes, providing consistent evaluation based on what was actually done, not how well it was described.

## Limitations

### AI Might Miss Context
- The AI only sees the diff, not the entire codebase
- Very complex issues might be difficult to fully assess
- The AI cannot run the code to verify it works

### False Negatives Possible
- If a student makes legitimate changes but in unexpected ways, the AI might not recognize the connection
- Very large diffs (>4000 chars) are truncated

### False Positives Possible
- If a student makes changes that look right but don't actually work, the AI might pass them
- The AI cannot test functionality, only analyze code intent

## Best Practices for Instructors

1. **Review AI Results**: Check the explanation when a score seems wrong
2. **Adjust Confidence Threshold**: Consider implementing a minimum confidence score if needed
3. **Manual Override**: For edge cases, you can manually adjust scores
4. **Clear Issues**: Write clear, specific issue descriptions for more accurate AI analysis
5. **Monitor Patterns**: If many students fail AI analysis, the issue description might be too vague

## Configuration

The AI provider can be changed in `config.json`:
```json
{
  "aiProvider": "openai"
}
```

API key must be set in `.env`:
```
OPENAI_API_KEY=your_key_here
```

## Future Enhancements

Potential improvements:
- Support for GitHub Copilot API as an alternative
- Configurable confidence thresholds
- Multi-PR analysis (analyze all related PRs, not just the first)
- Batch analysis for faster grading
- Code execution/testing for functional verification

