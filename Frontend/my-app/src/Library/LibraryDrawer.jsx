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
  openLibrary,
  openDriveNote,
  setProfileMenuOpen,
  navigateToPage,
}) {
  const filteredLibraryNotes = libraryNotes.filter((note) =>
    note.name.toLowerCase().includes(librarySearch.trim().toLowerCase()),
  );

  const onClose = () => setLibraryOpen(false);
  const onLoadNotes = openLibrary;
  const onSignIn = () => setProfileMenuOpen(true);
  const onOpenNote = openDriveNote;
  const onStartLearning = () => navigateToPage("learn");

  return (
      <div
        className={`library-backdrop${libraryOpen ? " is-open" : ""}`}
        aria-hidden={!libraryOpen}
        inert={!libraryOpen}
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      >
        <aside className="library-drawer" role="dialog" aria-modal="true" aria-labelledby="library-title">
          <div className="library-drawer-heading">
            <div>
              <span className="eyebrow">SAVED TO GOOGLE DRIVE</span>
              <h2 id="library-title">Your library</h2>
            </div>
            <button type="button" className="library-close" aria-label="Close library" onClick={() => onClose()}>×</button>
          </div>
          <p className="library-intro">Your EasyLearn notes, ready to pick up again.</p>
          {libraryLoading ? (
            <div className="library-state" role="status"><span className="library-spinner" />Loading your notes…</div>
          ) : !authChecked ? (
            <div className="library-state" role="status"><span className="library-spinner" />Checking your account…</div>
          ) : !userProfile ? (
            <div className="library-state library-empty-state">
              <span className="library-state-icon" aria-hidden="true">↗</span>
              <strong>Sign in to see your notes</strong>
              <p>Connect your Google account to open notes you saved from EasyLearn.</p>
              <button type="button" className="library-action-button" onClick={() => { onClose(); onSignIn(); }}>Sign in with Google</button>
            </div>
          ) : libraryError ? (
            <div className="library-state library-empty-state" role="alert">
              <strong>Couldn’t load your notes</strong>
              <p>{libraryError}</p>
              <button type="button" className="library-action-button" onClick={onLoadNotes}>Try again</button>
            </div>
          ) : !libraryLoaded ? (
            <div className="library-state library-empty-state">
              <strong>Ready to connect your notes</strong>
              <p>Connect to Google Drive to see the lessons you’ve saved.</p>
              <button type="button" className="library-action-button" onClick={onLoadNotes}>Load my notes</button>
            </div>
          ) : libraryNotes.length ? (
            <div className="library-content">
              <label className="library-search">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
                <input type="search" value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search your notes" aria-label="Search saved notes" />
              </label>
              {filteredLibraryNotes.length ? (
                <div className="library-note-list" aria-label="Saved EasyLearn notes">
                  {groupLibraryNotes(filteredLibraryNotes).map((group) => (
                    <section className="library-note-group" key={group.title}>
                      <h3>{group.title}</h3>
                      {group.notes.map((note) => (
                        <button type="button" className="library-note-item" key={note.id} onClick={() => onOpenNote(note)}>
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
            </div>
          ) : (
            <div className="library-state library-empty-state">
              <span className="library-state-icon" aria-hidden="true">✦</span>
              <strong>Your first saved lesson will show up here</strong>
              <p>Ask a question, then choose <b>Save to Drive</b> to keep the lesson in your library.</p>
              <button type="button" className="library-action-button" onClick={() => { onClose(); onStartLearning(); }}>Start learning</button>
            </div>
          )}
          <div className="library-drawer-footer">Only EasyLearn notes in your EasyLearn Drive folder appear here.</div>
        </aside>
      </div>
  );
}
