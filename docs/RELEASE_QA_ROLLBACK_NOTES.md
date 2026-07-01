# Release QA And Rollback Notes

Ship plans include QA and rollback notes so readiness can become reviewable preparation work.

## QA Notes

QA notes capture:

- build status
- lint status
- validation status
- test status
- docs status
- secrets status
- manual QA evidence needed before external release execution

The ship-plan workflow does not execute project validation commands automatically.

## Rollback Notes

Rollback notes require the reviewer to record:

- currently deployed version or previous Git ref
- data migration reversibility
- restore procedure
- release owner
- project branch

## Boundary

QA and rollback notes are preparation records. They do not modify project repositories, deploy applications, tag releases, create GitHub releases, push commits, or write production data.
