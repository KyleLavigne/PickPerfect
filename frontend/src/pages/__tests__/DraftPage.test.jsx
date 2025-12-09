// frontend/src/pages/__tests__/DraftPage.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import DraftPage from "../DraftPage";

// Mock Auth0 so DraftPage doesn't blow up
vi.mock("@auth0/auth0-react", () => ({
    useAuth0: () => ({
        isAuthenticated: false,
        isLoading: false,
        getAccessTokenSilently: vi.fn()
    })
}));

const champs = [
    {
        key: "Aatrox",
        name: "Aatrox",
        iconUrl: "https://cdn.example.com/aatrox.png",
        roles: ["Top"],
        tags: ["Frontline"]
    },
    {
        key: "Ahri",
        name: "Ahri",
        iconUrl: "https://cdn.example.com/ahri.png",
        roles: ["Middle"],
        tags: ["Mage", "Pick"]
    }
];

describe("DraftPage", () => {
    test("renders basic draft UI elements", () => {
        const fetchChampions = vi.fn().mockResolvedValue(champs);

        render(<DraftPage fetchChampions={fetchChampions} />);

        // Core structural pieces
        expect(screen.getByText(/Draft Board/i)).toBeInTheDocument();
        expect(screen.getByText(/Blue Picks/i)).toBeInTheDocument();
        expect(screen.getByText(/Red Picks/i)).toBeInTheDocument();
        expect(screen.getByText(/Draft Name/i)).toBeInTheDocument();

        // Search + role filter controls exist
        const searchInput = screen.getByPlaceholderText(/search champions/i);
        expect(searchInput).toBeInTheDocument();

        const roleSelect = screen.getByDisplayValue(/All Roles/i);
        expect(roleSelect).toBeInTheDocument();
    });

    test("allows typing into the search input", () => {
        const fetchChampions = vi.fn().mockResolvedValue(champs);

        render(<DraftPage fetchChampions={fetchChampions} />);

        const searchInput = screen.getByPlaceholderText(/search champions/i);
        expect(searchInput).toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: "Ahri" } });
        expect(searchInput.value).toBe("Ahri");
    });
});
