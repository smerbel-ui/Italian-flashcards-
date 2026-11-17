# Fluent progress

This branch holds saved progress for the Fluent language-tutor plugin
(https://github.com/m98/fluent): learner profile, spaced-repetition schedule,
mistakes, mastery and session logs.

Cloud sessions check out this branch at `~/.claude/fluent-data` (the plugin's
default data folder). `autosave.sh` runs after each Claude reply and commits and
pushes any changes back here, so your next session — from any device — carries on
where you left off.

Don't merge this branch into the app's branches; it shares no history with them.
