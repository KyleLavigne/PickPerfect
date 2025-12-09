// frontend/src/components/__tests__/ChampCard.test.jsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ChampCard from "../ChampCard";

// Simple mock DD data returned from your backend
const mockDdData = {
    version: "14.1.1",
    champ: {
        lore: "A fearsome Darkin warrior.",
        title: "the Darkin Blade",
        passive: {
            name: "Deathbringer Stance",
            description: "Some passive description",
            image: { full: "AatroxP.png" }
        },
        spells: [
            {
                id: "AatroxQ",
                name: "The Darkin Blade",
                description: "Some Q description",
                image: { full: "AatroxQ.png" }
            }
        ],
        tags: ["Fighter", "Tank"]
    }
};

const baseChamp = {
    key: "Aatrox",
    name: "Aatrox",
    title: "the Darkin Blade",
    iconUrl: "https://cdn.example.com/aatrox.png",
    roles: ["Top"],
    tags: ["Frontline", "Bruiser"]
};

describe("ChampCard", () => {
    beforeEach(() => {
        // Mock global fetch for the DD details call
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockDdData
        });
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    test("renders champion name, image, roles, and tags", () => {
        render(<ChampCard champ={baseChamp} />);

        // name + img
        expect(screen.getByText("Aatrox")).toBeInTheDocument();
        const img = screen.getByAltText("Aatrox");
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", baseChamp.iconUrl);

        // roles badges (Top)
        expect(screen.getByText("Top")).toBeInTheDocument();

        // tags badges (Frontline, Bruiser)
        expect(screen.getByText("Frontline")).toBeInTheDocument();
        expect(screen.getByText("Bruiser")).toBeInTheDocument();
    });

    test("opens modal on click and calls onSelect when Pick is clicked", async () => {
        const handleSelect = vi.fn();

        render(<ChampCard champ={baseChamp} onSelect={handleSelect} />);

        // Click the main card (button has aria-label 'View info for Aatrox')
        const cardButton = screen.getByRole("button", {
            name: /view info for aatrox/i
        });
        fireEvent.click(cardButton);

        // Wait for modal header (this is the <h2> inside the modal)
        const modalTitle = await screen.findByRole("heading", {
            name: /aatrox/i
        });
        expect(modalTitle).toBeInTheDocument();

        // Ensure fetch was called for champion details
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Lore from mocked DD data should be visible
        expect(screen.getByText(/A fearsome Darkin warrior\./i)).toBeInTheDocument();

        // Click the Pick button
        const pickButton = screen.getByRole("button", { name: /pick aatrox/i });
        fireEvent.click(pickButton);

        // onSelect should have been called with champ
        expect(handleSelect).toHaveBeenCalledTimes(1);
        expect(handleSelect).toHaveBeenCalledWith(baseChamp);
    });

    test("closes modal when Close is clicked", async () => {
        render(<ChampCard champ={baseChamp} />);

        const cardButton = screen.getByRole("button", {
            name: /view info for aatrox/i
        });
        fireEvent.click(cardButton);

        // Wait for modal to open
        const closeButton = await screen.findByRole("button", {
            name: /close champion details/i
        });
        expect(closeButton).toBeInTheDocument();

        fireEvent.click(closeButton);

        // Modal should disappear
        await waitFor(() => {
            expect(
                screen.queryByRole("button", { name: /close champion details/i })
            ).not.toBeInTheDocument();
        });
    });
});
