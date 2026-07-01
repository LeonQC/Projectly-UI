export const user = {
  name: "John",
  initials: "J",
};

export const workspaces = [
  {
    id: "workspace-1",
    name: "Workspace 1",
    boards: [
      { id: "board-1", name: "Board1" },
      { id: "board-2", name: "Board2" },
    ],
  },
  {
    id: "workspace-2",
    name: "Workspace 2",
    boards: [{ id: "board-3", name: "w2-Board1" }],
  },
];

export const guestWorkspaces = [
  {
    id: "guest-workspace1",
    name: "Guest workspace1",
    boards: [{ id: "guest-board-1", name: "Invited Board" }],
  },
];
