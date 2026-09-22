window.onload = async function() {
    try {
        const result = document.getElementById("result");
        result.textContent = "Loading movie data...";
        result.className = "loading";

        await loadData();
        populateMoviesDropdowns();

        result.textContent = "Data loaded. Select three movies you have watched.";
        result.className = "success";
    } catch (error) {
        console.error("Initialization error:", error);
    }
};

function populateMoviesDropdowns() {
    const sortedMovies = [...movies].sort((a, b) => a.title.localeCompare(b.title));
    const selectors = [
        document.getElementById("movie-select-1"),
        document.getElementById("movie-select-2"),
        document.getElementById("movie-select-3")
    ];

    selectors.forEach(select => {
        while (select.options.length > 1) select.remove(1);

        sortedMovies.forEach(movie => {
            const option = document.createElement("option");
            option.value = movie.id;
            option.textContent = movie.title;
            select.appendChild(option);
        });
    });
}

function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildProfileVector(selectedMovies) {
    const profile = new Array(genreNames.length).fill(0);

    selectedMovies.forEach(movie => {
        movie.vector.forEach((value, i) => {
            profile[i] += value;
        });
    });

    return profile.map(value => value / selectedMovies.length);
}

function topFiveByCosine(queryVector, excludedIds) {
    return movies
        .filter(movie => !excludedIds.has(movie.id))
        .map(movie => ({
            movie,
            score: cosineSimilarity(queryVector, movie.vector)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

function getRecommendations() {
    const result = document.getElementById("result");

    const ids = [
        parseInt(document.getElementById("movie-select-1").value),
        parseInt(document.getElementById("movie-select-2").value),
        parseInt(document.getElementById("movie-select-3").value)
    ];

    if (ids.some(id => Number.isNaN(id))) {
        result.textContent = "Please select all three movies first.";
        result.className = "error";
        return;
    }

    if (new Set(ids).size !== ids.length) {
        result.textContent = "Please choose three different movies.";
        result.className = "error";
        return;
    }

    const selectedMovies = ids.map(id => movies.find(movie => movie.id === id));
    const excludedIds = new Set(ids);

    result.textContent = "Calculating cosine recommendations...";
    result.className = "loading";

    setTimeout(() => {
        // Item-to-item baseline: first selected movie is the active item.
        const itemResults = topFiveByCosine(selectedMovies[0].vector, excludedIds);

        // Profile-based approach: average the three watched movie vectors.
        const profileVector = buildProfileVector(selectedMovies);
        const profileResults = topFiveByCosine(profileVector, excludedIds);

        const itemText = itemResults.map((x, i) =>
            `${i + 1}. ${x.movie.title} (${x.score.toFixed(3)})`
        ).join("<br>");

        const profileText = profileResults.map((x, i) =>
            `${i + 1}. ${x.movie.title} (${x.score.toFixed(3)})`
        ).join("<br>");

        result.innerHTML = `
            <strong>Watched movies:</strong> ${selectedMovies.map(m => m.title).join(", ")}
            <br><br>
            <strong>Item-to-item (active movie: ${selectedMovies[0].title}) — Top 5</strong>
            <br>${itemText}
            <br><br>
            <strong>Profile-based (average of 3 movies) — Top 5</strong>
            <br>${profileText}
        `;
        result.className = "success";
    }, 100);
}

// Exposed for browser-console verification.
window.cosineSimilarity = cosineSimilarity;
window.buildProfileVector = buildProfileVector;
window.topFiveByCosine = topFiveByCosine;
