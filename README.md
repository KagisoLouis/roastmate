# Roastmate mobile update

## What changed
- Compact mobile header and controls.
- The complete roast remains visible above the board, without truncation.
- Green strategy strip retains the next move, source/destination, and Show me on the board.
- Longer strategy explanations, rules, settings, history, and chat move into More on mobile.
- Board size responds to available viewport height. Extremely short windows or large accessibility text may still need scrolling; the joke is never clipped.
- White and Black each receive ten minutes. Clocks start with the first white move, switch automatically, and stop at game end or timeout.
- Take it back restores the previous human turn's clocks. New Game resets both.
- Desktop retains the existing two-column composition and gains clocks.

## Update the existing Vercel website
1. Extract this ZIP.
2. Open the GitHub repository already connected to your Vercel project.
3. Add file > Upload files. Upload every extracted file directly into the repository root, replacing the same filenames. Upload the files, not the ZIP or a containing folder.
4. Commit to the production branch, usually main, with message: Mobile layout and chess clocks.
5. Open the existing Vercel project > Deployments. Wait for the new production deployment to become Ready.
6. Open your existing website address and refresh. On mobile, try an incognito tab if old files persist.

Keep the existing Vercel project and settings. No environment variables or build step are needed for this static package.

## Verification
Syntax, module paths, clocks, computer replies, green move suggestions, board highlighting, takeback restoration, and new-game reset were checked programmatically. A visual mobile-browser check was not available in the build environment. Check your phone after deploying and share a screenshot if spacing needs adjustment.
