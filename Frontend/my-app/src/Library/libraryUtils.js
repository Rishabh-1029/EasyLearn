export function groupLibraryNotes(notes) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const groups = [
    { title: "Today", notes: [] },
    { title: "This week", notes: [] },
    { title: "Earlier", notes: [] },
  ];
  for (const note of notes) {
    const date = new Date(note.modifiedTime || 0);
    const daysAgo = Number.isNaN(date.getTime())
      ? Infinity
      : Math.floor(
          (today - new Date(date.getFullYear(), date.getMonth(), date.getDate())) /
            86400000,
        );
    groups[daysAgo === 0 ? 0 : daysAgo < 7 ? 1 : 2].notes.push(note);
  }
  return groups.filter((group) => group.notes.length);
}
