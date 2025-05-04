app.py
from flask import Flask, render_template, jsonify, request
import pickle
import pandas as pd
import numpy as np

app = Flask(__name__)

# Load your models and data
popular_books = pickle.load(open('popular.pkl', 'rb'))
books = pickle.load(open('books.pkl', 'rb'))
pt = pickle.load(open('pt.pkl', 'rb'))
similarity_scores = pickle.load(open('similarity_scores.pkl', 'rb'))

@app.route('/')
def home():
    return render_template('index.html')  # Renders the HTML file

@app.route('/api/popular-books')
def get_popular_books():
    # Convert DataFrame to JSON format
    popular_books_json = popular_books.to_dict(orient='records')
    return jsonify(popular_books_json)

@app.route('/api/recommendations')
def get_recommendations():
    book_name = request.args.get('book')  # Get the book name from the query parameter
    recommendations = recommend(book_name)  # Call the recommend function
    return jsonify(recommendations)

@app.route('/api/all-books')
def get_all_books():
    # Load the books data from CSV
    all_books = pd.read_csv('books.csv')  # Adjust the path as necessary
    all_books_json = all_books.to_dict(orient='records')
    return jsonify(all_books_json)

def recommend(book_name):
    index = np.where(pt.index == book_name)[0][0]
    similar_items = sorted(list(enumerate(similarity_scores[index])), key=lambda x: x[1], reverse=True)[1:6]
    data = []
    for i in similar_items:
        temp_df = books[books['Book-Title'] == pt.index[i[0]]]
        item = {
            'title': temp_df['Book-Title'].values[0],
            'author': temp_df['Book-Author'].values[0],
            'imageUrl': temp_df['Image-URL-M'].values[0]
        }
        data.append(item)
    return data

if __name__ == '__main__':
    app.run(debug=True)


index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Book Recommender System</title>
  <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" />
 
</head>
<body>
  <header class="header">
    <img src="static/r.png" class="left-image" alt="Left Image">
    <img src="static/r.png" class="right-image" alt="Right Image">
    <div class="container">
      <h1>Book Recommender</h1>
      <nav>
        <ul>
          <li><a href="#popular">Popular Books</a></li>
          <li><a href="#recommendations">Recommendations</a></li>
          <li><a href="#reviews">User Reviews</a></li>
          <li><a href="#about">About Us</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="main">
    <div class="container">
      <section class="search-section">
        <h2>Search for a Book</h2>
        <div class="search-bar">
          <input type="text" id="searchBox" placeholder="Search for a book..." />
          <button id="searchButton">Search</button>
        </div>
      </section>
   
    
      <section class="popular-books" id="popular">
        <h2>Top 50 Books</h2>
        <div class="grid-container" id="bookGrid"></div>
      </section>

      <section class="recommendations" id="recommendations" style="display: none;">
        <h2>Recommended Books</h2>
        <button id="backButton">Back to Popular Books</button>
        <div class="grid-container" id="recommendationGrid"></div>
      </section>

      <section class="user-reviews" id="reviews">
        <h2>User Reviews</h2>
        <div class="user-reviews">
          <div class="review">
            <p>"An amazing selection of books! Highly recommend!"</p>
            <span>- Jane Doe</span>
          </div>
          <div class="review">
            <p>"Great recommendations based on my reading history."</p>
            <span>- John Smith</span>
          </div>
          <div class="review">
            <p>"I found several hidden gems through this platform."</p>
            <span>- Emily Johnson</span>
          </div>
        </div>
      </section>

      <section class="about" id="about">
        <h2>About Us</h2>
        <div class="about">
          <p>We are passionate about books and aim to connect readers with their next favorite read. Our recommendations are powered by user ratings and preferences.</p>
        </div>
      </section>
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2024 Book Recommender System. All rights reserved.</p>
    </div>
  </footer>
  <div id="loading" style="display: none; text-align: center; margin: 20px;">Loading...</div>


  <script src="{{ url_for('static', filename='script.js') }}"></script>
</body>
</html>


style.css

body {
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #f2f5f9 30%, #dfe3ec 100%);
    color: #1a1a2e;
}
body {
    /* ... other styles ... */
    background-image: url('https://static.vecteezy.com/system/resources/previews/001/984/861/non_2x/abstract-blue-geometric-circles-overlapping-background-with-light-blue-free-vector.jpg');
    background-size: cover;
    background-repeat: repeat;
    background-attachment: fixed; /* Keeps the background fixed while scrolling */
}

.header {
    background: linear-gradient(90deg, #1a1a2e, #35356b);
    padding: 15px 0;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.container {
    max-width: 1200px; /* Slightly wider container */
    margin: 0 auto;
    padding: 20px 15px;
}

/* Center and style the main title */
h1 {
    color: #ffffff; /* White for better visibility */
    font-weight: 700;
    text-align: center;
    margin-top: 20px;
    font-size: 2.2em; /* Decreased size for more space */
    letter-spacing: 1px;
}

h2 {
    color: #35356b;
    font-weight: 600;
    text-align: center;
    margin: 40px 0 20px;
    font-size: 1.8em; /* Decreased size */
}

/* Navigation styling */
nav ul {
    list-style: none;
    display: flex;
    justify-content: center;
    padding: 0;
    margin: 0;
    gap: 30px; /* Keep this as is for navigation spacing */
}

nav a {
    color: #ffffff;
    font-size: 1.1rem; /* Slightly smaller font */
    font-weight: 500;
    text-decoration: none;
    padding: 10px 20px; /* Reduced padding */
    border-radius: 20px; /* More rounded corners */
    transition: background-color 0.3s, color 0.3s, transform 0.3s;
}

nav a:hover {
    background-color: #ff6f61;
    transform: translateY(-2px); /* Slight upward movement on hover */
}

/* Search section styling */
.search-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 30px 0;
}

.search-bar {
    display: flex;
    width: 100%;
    max-width: 600px; /* Keep the search bar width */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border-radius: 20px;
    overflow: hidden;
}

.search-bar input {
    padding: 10px; /* Reduced padding */
    border: none;
    width: 100%;
    font-size: 1rem; /* Smaller font size */
    outline: none;
}

.search-bar button {
    padding: 10px 20px; /* Reduced padding */
    background: linear-gradient(90deg, #ff6f61, #ff4a35);
    color: #fff;
    border: none;
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
}

.search-bar button:hover {
    background: linear-gradient(90deg, #ff4a35, #ff2a15);
    transform: scale(1.03); /* Slightly enlarge on hover */
}

/* Book card grid layout */
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Adjust min width for smaller cards */
    gap: 15px; /* Reduced gap */
    padding: 20px;
    align-items: stretch;
}

/* Book card styling */
.book-card {
    background-color: #ffffff;
    border-radius: 12px; /* Slightly smaller radius */
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1); /* Lighter shadow */
    padding: 15px; /* Reduced padding */
    text-align: center;
    transition: transform 0.3s, box-shadow 0.3s;
    overflow: hidden;
    position: relative;
}

.book-card:hover {
    transform: translateY(-5px); /* Less pronounced hover effect */
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.book-card img {
    max-width: 80%; /* Adjusted for smaller images */
    height: auto;
    margin-bottom: 10px;
    border-radius: 8px; /* Smaller radius */
    transition: transform 0.3s;
}

.book-card:hover img {
    transform: scale(1.03); /* Smaller scale on hover */
}

.book-title {
    font-size: 1.2em; /* Decreased size for better fitting */
    font-weight: bold;
    color: #1a1a2e;
    margin-bottom: 8px; /* Reduced margin */
}

.book-author {
    color: #555;
    font-size: 1em; /* Smaller size */
    margin-bottom: 8px;
}

.ratings {
    color: #f0c23b;
    font-weight: bold;
    font-size: 1.1em; /* Decreased size */
}

/* User Reviews section */
.user-reviews {
    background-color: #f9f9f9;
    border-radius: 10px; /* Adjusted radius */
    padding: 15px; /* Reduced padding */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    margin: 20px 0;
}

.review {
    border-left: 5px solid #ff6f61;
    padding-left: 10px; /* Reduced padding */
    margin: 5px 0; /* Reduced margin */
    font-style: italic;
    color: #333;
}

/* About Us section */
.about {
    background-color: #e9ecef;
    border-radius: 10px; /* Adjusted radius */
    padding: 15px; /* Reduced padding */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    margin: 20px 0;
}

.about p {
    line-height: 1.5; /* Adjusted line height */
    color: #333;
    text-align: center;
}

/* Footer styling */
.footer {
    background: #1a1a2e;
    color: #fff;
    padding: 20px 0; /* Reduced padding */
    text-align: center;
    font-size: 1em; /* Standard size */
    margin-top: 40px;
}

footer a {
    color: #ff6f61;
    text-decoration: none;
    transition: color 0.3s;
}

.footer a:hover {
    color: #ff4a35;
    text-decoration: underline;
}

#backButton {
    background: linear-gradient(90deg, #ff4a35, #ff2a15);
    color: #fff; /* White text for better contrast */
    padding: 10px 20px; /* Adequate padding for better click area */
    border: none; /* Remove default border */
    border-radius: 25px; /* More rounded corners for a softer look */
    font-size: 1.1em; /* Slightly larger font size */
    font-weight: bold; /* Make text bold for emphasis */
    cursor: pointer; /* Pointer cursor on hover */
    transition: background 0.3s, transform 0.3s, box-shadow 0.3s; /* Smooth transitions */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); /* Soft shadow for depth */
}

/* Hover state */
#backButton:hover {
    background: linear-gradient(90deg, #ff6f61, #ff4a35); /* Lighter gradient on hover */
    transform: translateY(-3px); /* Slight upward movement on hover */
}

/* Focus state for accessibility */
#backButton:focus {
    outline: none; /* Remove default focus outline */
    box-shadow: 0 0 0 3px rgba(255, 112, 85, 0.5); /* Add custom focus outline */
}

/* Active state for click effect */
#backButton:active {
    transform: scale(0.98); /* Slightly shrink on click */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15); /* Reduce shadow on click */
}

/* ... other CSS styles ... */

.header {
    background: linear-gradient(90deg, #1a1a2e, #35356b);
    padding: 15px 0;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    position: relative; /* To position images absolutely */
}

.header img.left-image {
    position: absolute;
    top: 50%;
    left: 20px;
    transform: translateY(-50%);
    width: 90px; /* Adjust the width as needed */
    height: 90px; /* Adjust the height as needed */
}

.header img.right-image {
    position: absolute;
    top: 10px;
    right: 20px;
    width: 90px; /* Adjust the width as needed */
    height: 90px; /* Adjust the height as needed */
}

script.js

let searchTimeout; // For debouncing the search input

async function fetchPopularBooks() {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; // Show loading
    try {
        const response = await fetch('/api/popular-books'); // Fetch popular books from the Flask backend
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const books = await response.json();
        return books;
    } catch (error) {
        console.error('Error fetching popular books:', error);
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading regardless of success or error
    }
}

async function fetchRecommendations(bookName) {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block'; // Show loading
    try {
        const response = await fetch(`/api/recommendations?book=${bookName}`); // Fetch recommendations based on selected book
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const recommendations = await response.json();
        return recommendations;
    } catch (error) {
        console.error('Error fetching recommendations:', error);
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading regardless of success or error
    }
}

async function populateBooks() {
    try {
        const popularBooks = await fetchPopularBooks();
        const bookGrid = document.getElementById('bookGrid');

        // Clear the grid before populating
        bookGrid.innerHTML = '';

        // Populate the grid
        popularBooks.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            bookCard.innerHTML = `
                <img src="${book['Image-URL-M']}" alt="Book Cover" class="book-cover" data-title="${book['Book-Title']}">
                <div class="book-title">${book['Book-Title']}</div>
                <div class="book-author">by ${book['Book-Author']}</div>
                <div class="ratings">Ratings: ${book['num_ratings'] || 'N/A'}</div>
                <div class="ratings">Avg. Rating: ${book['avg_rating'] ? book['avg_rating'].toFixed(2) : 'N/A'}</div>
            `;
            bookGrid.appendChild(bookCard);
        });

        // Add click event to each book cover
        addBookCoverClickEvents();

    } catch (error) {
        console.error('Error populating books:', error);
    }
}

function addBookCoverClickEvents() {
    document.querySelectorAll('.book-cover').forEach(img => {
        img.addEventListener('click', async (event) => {
            const bookTitle = event.target.getAttribute('data-title');
            const recommendations = await fetchRecommendations(bookTitle);
            const recommendationGrid = document.getElementById('recommendationGrid');
            recommendationGrid.innerHTML = ''; // Clear previous recommendations

            // Hide popular books section and show recommendations
            document.querySelector('.popular-books').style.display = 'none';  // Hide popular books
            document.querySelector('.recommendations').style.display = 'block'; // Show recommendations

            // Populate recommended books
            recommendations.forEach(book => {
                const bookCard = document.createElement('div');
                bookCard.className = 'book-card';
                bookCard.innerHTML = `
                    <img src="${book.imageUrl}" alt="Book Cover">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">by ${book.author}</div>
                `;
                recommendationGrid.appendChild(bookCard);
            });
        });
    });
}

// Function to filter books based on search term
function filterBooks(searchTerm) {
    const bookGrid = document.getElementById('bookGrid');
    const allBooks = Array.from(bookGrid.children); // Get all book cards

    // Filter the books
    allBooks.forEach(bookCard => {
        const bookTitle = bookCard.querySelector('.book-title').textContent.toLowerCase();
        const bookAuthor = bookCard.querySelector('.book-author').textContent.toLowerCase();
        if (bookTitle.includes(searchTerm) || bookAuthor.includes(searchTerm)) {
            bookCard.style.display = ''; // Show book card
        } else {
            bookCard.style.display = 'none'; // Hide book card
        }
    });
}

// Debounce function to limit how often a function can fire
function debounce(func, delay) {
    return function(...args) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Event listener for search box input with debouncing
const handleSearch = debounce((event) => {
    const searchTerm = event.target.value.toLowerCase();
    filterBooks(searchTerm);
}, 300); // Adjust the delay as needed (300ms here)

document.getElementById('searchBox').addEventListener('input', handleSearch);

// Event listener for search button click
document.getElementById('searchButton').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    filterBooks(searchTerm);
});

// Event listener for back button click
document.getElementById('backButton').addEventListener('click', () => {
    document.querySelector('.recommendations').style.display = 'none'; // Hide recommendations
    document.querySelector('.popular-books').style.display = 'block'; // Show popular books
});

// Call this to populate the initial popular books
populateBooks();

