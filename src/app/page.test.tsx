import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

function startFourPlayerTournament() {
  render(<Home />);

  fireEvent.click(screen.getByRole("button", { name: "4" }));
  fireEvent.change(screen.getByPlaceholderText("Player 1"), {
    target: { value: "Anna" },
  });
  fireEvent.change(screen.getByPlaceholderText("Player 2"), {
    target: { value: "Bert" },
  });
  fireEvent.change(screen.getByPlaceholderText("Player 3"), {
    target: { value: "Cara" },
  });
  fireEvent.change(screen.getByPlaceholderText("Player 4"), {
    target: { value: "Dave" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /Start Tournament \(3 matches\)/ })
  );
}

describe("tournament flow", () => {
  it("starts a tournament, records a score, finishes, and can start a new one", () => {
    startFourPlayerTournament();

    expect(screen.getByRole("heading", { name: "Matches" })).toBeDefined();
    expect(screen.getByText("0 / 3 completed")).toBeDefined();

    const firstMatch = screen.getByText("Match 1").parentElement
      ?.parentElement as HTMLElement;
    fireEvent.click(within(firstMatch).getAllByRole("button")[0]);
    fireEvent.click(screen.getByRole("button", { name: "16" }));

    expect(screen.getByText("1 / 3 completed")).toBeDefined();
    expect(screen.getAllByText("16").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Finish Tournament" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Yes, Apply Even Scores/ })
    );

    expect(
      screen.getByRole("heading", { name: "Tournament Results" })
    ).toBeDefined();
    expect(screen.getByText("3 matches completed")).toBeDefined();
    expect(screen.getByText("Final Rankings")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "New Tournament" }));
    fireEvent.click(screen.getByRole("button", { name: "Start New" }));

    expect(
      screen.getByRole("heading", { name: "Tournament Setup" })
    ).toBeDefined();
  });

  it("play again starts a fresh round with the same players", () => {
    startFourPlayerTournament();

    const firstMatch = screen.getByText("Match 1").parentElement
      ?.parentElement as HTMLElement;
    fireEvent.click(within(firstMatch).getAllByRole("button")[0]);
    fireEvent.click(screen.getByRole("button", { name: "16" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish Tournament" }));
    fireEvent.click(screen.getByRole("button", { name: "No, Finish As-Is" }));

    fireEvent.click(screen.getByRole("button", { name: "Play Again" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Play Again",
      })
    );

    expect(screen.getByRole("heading", { name: "Matches" })).toBeDefined();
    expect(screen.getByText("0 / 3 completed")).toBeDefined();
    expect(screen.getAllByText("Anna").length).toBeGreaterThan(0);
  });

  it("recovers setup when stored view is matches but tournament data is gone", () => {
    localStorage.setItem("padelmavene_currentView", "matches");
    localStorage.setItem("padelmavene_tournamentData", "not-json");

    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Tournament Setup" })
    ).toBeDefined();
  });
});
