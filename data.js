let movies = [];
let ratings = [];

const genreNames = [
    "Action","Adventure","Animation","Children's","Comedy","Crime",
    "Documentary","Drama","Fantasy","Film-Noir","Horror","Musical",
    "Mystery","Romance","Sci-Fi","Thriller","War","Western"
];

async function loadData() {
    try {
        const moviesResponse = await fetch("u.item");
        if (!moviesResponse.ok) throw new Error(`Failed to load u.item: ${moviesResponse.status}`);
        parseItemData(await moviesResponse.text());

        const ratingsResponse = await fetch("u.data");
        if (!ratingsResponse.ok) throw new Error(`Failed to load u.data: ${ratingsResponse.status}`);
        parseRatingData(await ratingsResponse.text());
    } catch (error) {
        console.error("Error loading data:", error);
        const result = document.getElementById("result");
        if (result) {
            result.textContent = `Error: ${error.message}`;
            result.className = "error";
        }
        throw error;
    }
}

function parseItemData(text) {
    for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        const fields = line.split("|");
        if (fields.length < 24) continue;

        const id = parseInt(fields[0]);
        const title = fields[1];

        // Field 5 is the separate unknown flag.
        // The 18 named genre flags are fields 6..23.
        const genreValues = fields.slice(6, 24).map(value => parseInt(value));
        const genres = genreNames.filter((_, i) => genreValues[i] === 1);
        const vector = genreNames.map((_, i) => genreValues[i] === 1 ? 1 : 0);

        movies.push({ id, title, genres, vector });
    }
}

function parseRatingData(text) {
    for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        const fields = line.split("\t");
        if (fields.length < 4) continue;

        ratings.push({
            userId: parseInt(fields[0]),
            itemId: parseInt(fields[1]),
            rating: parseFloat(fields[2]),
            timestamp: parseInt(fields[3])
        });
    }
}
