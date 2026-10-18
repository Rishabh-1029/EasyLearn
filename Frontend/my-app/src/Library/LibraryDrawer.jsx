import { groupLibraryNotes } from "./libraryUtils.js";

export default function LibraryDrawer({
  libraryOpen,
  setLibraryOpen,
  libraryLoading,
  authChecked,
  userProfile,
  libraryError,
  libraryLoaded,
  libraryNotes,
  librarySearch,
  setLibrarySearch,
  driveMounted,
  recentTopics,
  openRecentTopic,
  mountDrive,
  openDriveNote,
  setProfileMenuOpen,
  navigateToPage,
}) {
  const filteredLibraryNotes = libraryNotes.filter((note) =>
    note.name.toLowerCase().includes(librarySearch.trim().toLowerCase()),
  );

  const onClose = () => setLibraryOpen(false);
  const onLoadNotes = mountDrive;
  const onSignIn = () => setProfileMenuOpen(true);

  return (
    <div
      className={`library-backdrop${libraryOpen ? " is-open" : ""}`}
      aria-hidden={!libraryOpen}
      inert={!libraryOpen}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="library-drawer" role="dialog" aria-modal="true" aria-labelledby="library-title">
        <div className="library-drawer-heading">
          <div>
            <span className="eyebrow">ON THIS DEVICE + GOOGLE DRIVE</span>
            <h2 id="library-title">Your library</h2>
          </div>
          <button type="button" className="library-close" aria-label="Close library" onClick={onClose}>×</button>
        </div>
        <p className="library-intro">Pick up a recent question or open a lesson you saved.</p>

        <div className="library-sections">
          <section className="library-section">
            <div className="library-section-heading">
              <span className="eyebrow">RECENT TOPICS</span>
              <small>Saved on this device</small>
            </div>
            {recentTopics.length ? (
              <div className="library-note-list" aria-label="Recent topics on this device">
                {recentTopics.map((topic) => (
                  <button
                    type="button"
                    className="library-note-item"
                    key={topic.messageIndex}
                    onClick={() => openRecentTopic(topic.messageIndex)}
                  >
                    <span className="library-note-icon" aria-hidden="true">↺</span>
                    <span className="library-note-copy">
                      <strong>{topic.title}</strong>
                      <small>Continue this conversation</small>
                    </span>
                    <span className="library-note-chevron" aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="library-local-empty">Your questions will appear here as you learn.</div>
            )}
          </section>

          <section className="library-section">
            <div className="library-section-heading">
              <span className="eyebrow">SAVED TO GOOGLE DRIVE</span>
              {userProfile && (!driveMounted || !libraryLoaded) ? (
                <button
                  type="button"
                  className="library-mount-button"
                  onClick={mountDrive}
                  disabled={libraryLoading}
                >
                  {libraryLoading
                    ? "Connecting…"
                    : driveMounted
                      ? "Load Drive notes"
                      : "Mount Google Drive"}
                </button>
              ) : libraryNotes.length > 0 ? (
                <small>{libraryNotes.length} {libraryNotes.length === 1 ? "lesson" : "lessons"}</small>
              ) : null}
            </div>
            {libraryLoading ? (
              <div className="library-state" role="status"><span className="library-spinner" />Loading your notes…</div>
            ) : !authChecked ? (
              <div className="library-state" role="status"><span className="library-spinner" />Checking your account…</div>
            ) : !userProfile ? (
              <div className="library-drive-prompt">
                <p>Sign in to open notes saved to your Google Drive.</p>
                <button type="button" className="library-action-button" onClick={() => { onClose(); onSignIn(); }}>Sign in with Google</button>
              </div>
            ) : libraryError ? (
              <div className="library-state library-empty-state" role="alert">
                <strong>Couldn’t load your notes</strong>
                <p>{libraryError}</p>
                <button type="button" className="library-action-button" onClick={onLoadNotes}>Try again</button>
              </div>
            ) : !libraryLoaded ? (
              <div className="library-drive-prompt">
                <p>Mount Google Drive to see the lessons you’ve saved.</p>
              </div>
            ) : libraryNotes.length ? (
              <>
                <label className="library-search">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
                  <input type="search" value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search saved notes" aria-label="Search saved notes" />
                </label>
                {filteredLibraryNotes.length ? (
                  <div className="library-note-list" aria-label="Saved EasyLearn notes">
                    {groupLibraryNotes(filteredLibraryNotes).map((group) => (
                      <section className="library-note-group" key={group.title}>
                        <h3>{group.title}</h3>
                        {group.notes.map((note) => (
                          <button type="button" className="library-note-item" key={note.id} onClick={() => openDriveNote(note)}>
                            <span className="library-note-icon" aria-hidden="true">▤</span>
                            <span className="library-note-copy">
                              <strong>{note.name.replace(/\s-\s\d{4}-\d{2}-\d{2} .+\.md$/i, "").replace(/\.md$/i, "")}</strong>
                              <small>{note.modifiedTime ? new Date(note.modifiedTime).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Saved note"}</small>
                            </span>
                            <span className="library-note-chevron" aria-hidden="true">›</span>
                          </button>
                        ))}
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="library-no-results">No notes match “{librarySearch}”.</div>
                )}
              </>
            ) : (
              <div className="library-drive-prompt">
                <p>Your first saved lesson will show up here. Choose <b>Save to Drive</b> on an answer to keep it.</p>
                <button type="button" className="library-action-button" onClick={() => { onClose(); navigateToPage("learn"); }}>Start learning</button>
              </div>
            )}
          </section>
        </div>
        <div className="library-drawer-footer">Recent topics stay in this browser. Drive notes are stored in your Google Drive.</div>
      </aside>
    </div>
  );
}
