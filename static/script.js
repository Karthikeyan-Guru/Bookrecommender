// Utility functions for book data handling
function normalizeBookTitle(title) {
    if (!title) return '';
    return title.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
}

function cleanBookData(book) {
    return {
        'Image-URL-M': book['Image-URL-M'] || book.imageUrl || '',
        'Book-Title': book['Book-Title'] || book.title || '',
        'Book-Author': book['Book-Author'] || book.author || '',
        'num_ratings': book['num_ratings'] || book.numRatings || 'N/A',
        'avg_rating': book['avg_rating'] || book.avgRating || 'N/A'
    };
}

// API functions for book data fetching
async function fetchPopularBooks() {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block';
    try {
        const response = await fetch('/api/popular-books');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const books = await response.json();
        return books;
    } catch (error) {
        console.error('Error fetching popular books:', error);
        return [];
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

async function fetchRecommendations(bookTitle) {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block';
    
    try {
        // First try with the exact title
        const response = await fetch(`/api/recommendations?book=${encodeURIComponent(bookTitle)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const recommendations = await response.json();
        if (!recommendations || recommendations.error) {
            throw new Error(recommendations.error || 'No recommendations found');
        }
        return recommendations;
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return null;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

async function searchBooks(searchTerm) {
    try {
        const response = await fetch(`/api/search-books?query=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error searching books:', error);
        return [];
    }
}

// Book card creation functions
function createBookCard(book) {
    const bookData = cleanBookData(book);
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    
    const normalizedTitle = normalizeBookTitle(bookData['Book-Title']);
    bookCard.innerHTML = `
        <img src="${bookData['Image-URL-M']}" alt="Book Cover" class="book-cover" 
             data-title="${bookData['Book-Title']}">
        <div class="book-title">${bookData['Book-Title']}</div>
        <div class="book-author">by ${bookData['Book-Author']}</div>
        
        <!-- Star Rating Section -->
        <div class="rating-section">
            <label>Rate this book:</label>
            <div class="star-rating" data-title="${bookData['Book-Title']}">
                <span class="star" data-value="1">&#9733;</span>
                <span class="star" data-value="2">&#9733;</span>
                <span class="star" data-value="3">&#9733;</span>
                <span class="star" data-value="4">&#9733;</span>
                <span class="star" data-value="5">&#9733;</span>
            </div>
            <button class="submit-rating" data-title="${bookData['Book-Title']}">Submit Rating</button>
        </div>
    `;

    // Add event listeners for star ratings
    const stars = bookCard.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const ratingValue = star.getAttribute('data-value');
            // Highlight the selected star and reset others
            stars.forEach(s => s.classList.remove('selected'));
            for (let i = 0; i < ratingValue; i++) {
                stars[i].classList.add('selected');
            }
        });
    });

    return bookCard;
}

function createRecommendationCard(book) {
    const bookData = cleanBookData(book);
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.innerHTML = `
        <img src="${bookData['Image-URL-M']}" alt="Book Cover">
        <div class="book-title">${bookData['Book-Title']}</div>
        <div class="book-author">by ${bookData['Book-Author']}</div>
    `;
    return bookCard;
}

// Main functionality
let searchTimeout;

async function populateBooks() {
    try {
        const popularBooks = await fetchPopularBooks();
        const bookGrid = document.getElementById('bookGrid');
        bookGrid.innerHTML = '';
        
        popularBooks.forEach(book => {
            const bookCard = createBookCard(book);
            bookGrid.appendChild(bookCard);
        });

        addBookCoverClickEvents();
        addRatingEventListeners(); // Add this line to register rating events
    } catch (error) {
        console.error('Error populating books:', error);
    }
}

function addBookCoverClickEvents() {
    document.querySelectorAll('.book-cover').forEach(img => {
        const newImg = img.cloneNode(true);
        img.parentNode.replaceChild(newImg, img);
        
        newImg.addEventListener('click', async (event) => {
            const bookTitle = event.target.getAttribute('data-title');
            
            if (!bookTitle) {
                console.error('Book title information missing');
                return;
            }

            const recommendations = await fetchRecommendations(bookTitle);
            if (!recommendations) {
                alert('Sorry, no recommendations found for this book.');
                return;
            }

            const recommendationGrid = document.getElementById('recommendationGrid');
            recommendationGrid.innerHTML = '';

            document.querySelector('.popular-books').style.display = 'none';
            document.querySelector('.recommendations').style.display = 'block';

            recommendations.forEach(book => {
                const bookCard = createRecommendationCard(book);
                recommendationGrid.appendChild(bookCard);
            });
        });
    });
}

async function filterBooks(searchTerm) {
    const popularBooksHeading = document.getElementById('popular').querySelector('h2');
    if (searchTerm === '') {
        populateBooks();
        popularBooksHeading.style.display = 'block'; // Show the heading when populating popular books
        return;
    } else {
        popularBooksHeading.style.display = 'none'; // Hide the heading when searching
    }

    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block';

    try {
        const books = await searchBooks(searchTerm);
        const bookGrid = document.getElementById('bookGrid');
        bookGrid.innerHTML = '';

        books.forEach(book => {
            const bookCard = createBookCard(book);
            bookGrid.appendChild(bookCard);
        });

        addBookCoverClickEvents();
        addRatingEventListeners(); // Ensure rating events are added
    } catch (error) {
        console.error('Error filtering books:', error);
    } finally {
        loadingIndicator.style.display = 'none';
    }
}


function debounce(func, delay) {
    return function(...args) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const handleSearch = debounce((event) => {
    const searchTerm = event.target.value.toLowerCase();
    filterBooks(searchTerm);
}, 300);

// Rating Submission Functions
function addRatingEventListeners() {
    const ratingButtons = document.querySelectorAll('.submit-rating');
    
    ratingButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const bookTitle = event.target.getAttribute('data-title');
            const stars = event.target.previousElementSibling.querySelectorAll('.star');
            let ratingValue = 0;

            stars.forEach(star => {
                if (star.classList.contains('selected')) {
                    ratingValue = star.getAttribute('data-value');
                }
            });

            if (ratingValue === "0") {
                alert('Please select a rating before submitting.');
                return;
            }

            // Submit the rating to the backend
            const response = await submitRating(bookTitle, ratingValue);
            if (response.success) {
                alert('Thank you for your rating!');
            } else {
                alert('Error submitting your rating.');
            }
        });
    });
}

// Function to submit the rating to the backend
async function submitRating(bookTitle, rating) {
    try {
        const response = await fetch('/api/submit-rating', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookTitle, rating }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error submitting rating:', error);
        return { success: false };
    }
}

// Event Listeners
document.getElementById('searchBox').addEventListener('input', handleSearch);

document.getElementById('searchButton').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    filterBooks(searchTerm);
});

document.getElementById('backButton').addEventListener('click', () => {
    document.querySelector('.recommendations').style.display = 'none';
    document.querySelector('.popular-books').style.display = 'block';
});

// Initial call to populate popular books
populateBooks();
