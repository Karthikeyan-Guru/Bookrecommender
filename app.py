from flask import Flask, render_template, jsonify, request
from fuzzywuzzy import process
import pickle
import pandas as pd
import numpy as np

app = Flask(__name__)

# Load your models and data
popular_books = pickle.load(open(r'C:\Users\Karthikeyan\Desktop\Personalized Book Recommender (2)\Personalized Book Recommender\Personalized Book Recommender\popular.pkl', 'rb'))
books = pickle.load(open(r'C:\Users\Karthikeyan\Desktop\Personalized Book Recommender (2)\Personalized Book Recommender\Personalized Book Recommender\books.pkl', 'rb'))
pt = pickle.load(open(r'C:\Users\Karthikeyan\Desktop\Personalized Book Recommender (2)\Personalized Book Recommender\Personalized Book Recommender\pt.pkl', 'rb'))
similarity_scores = pickle.load(open(r'C:\Users\Karthikeyan\Desktop\Personalized Book Recommender (2)\Personalized Book Recommender\Personalized Book Recommender\similarity_scores.pkl', 'rb'))

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
    book_name = request.args.get('book')
    if not book_name:
        return jsonify({'error': 'No book name provided'}), 400
        
    try:
        # Try to find the book in the dataset
        book_matches = pt[pt.index.str.contains(book_name, case=False, regex=False)]
        
        if book_matches.empty:
            # If no exact match, try finding similar titles
            all_titles = pt.index.tolist()
            closest_match = process.extractOne(book_name, all_titles)
            if closest_match and closest_match[1] >= 80:  # 80% similarity threshold
                book_name = closest_match[0]
            else:
                return jsonify({'error': 'Book not found in database'}), 404
        else:
            book_name = book_matches.index[0]
            
        recommendations = recommend(book_name)
        return jsonify(recommendations)
        
    except Exception as e:
        print(f"Error getting recommendations: {str(e)}")
        return jsonify({'error': 'Error processing recommendation'}), 500

books = pd.read_csv(r'C:\Users\Karthikeyan\Desktop\Personalized Book Recommender (2)\Personalized Book Recommender\Personalized Book Recommender\Data\Books.csv')

@app.route('/api/search-books', methods=['GET'])
def search_books():
    query = request.args.get('query', '').lower()  # Get search query from request
    if not query:
        return jsonify([])  # Return empty list if no query is provided

    # Filter books where title or author matches the query
    matches = books[(books['Book-Title'].str.lower().str.contains(query)) |
                    (books['Book-Author'].str.lower().str.contains(query))]

    # Limit to 20 results
    limited_matches = matches.head(20)
    
    # Convert to JSON
    result = limited_matches.to_dict(orient='records')
    return jsonify(result)


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
ratings = {}
@app.route('/api/submit-rating', methods=['POST'])
def submit_rating():
    data = request.json
    book_title = data.get('bookTitle')
    rating = int(data.get('rating'))
    
    # Check if book_title is provided and if the rating is within the valid range
    if not book_title or rating < 1 or rating > 5:
        return jsonify(success=False, message="Invalid book title or rating")

    # Initialize an entry in the ratings dictionary for the book if it doesn't exist
    if book_title not in ratings:
        ratings[book_title] = []
    
    # Append the new rating to the book's rating list
    ratings[book_title].append(rating)

    # Calculate average rating if needed
    average_rating = sum(ratings[book_title]) / len(ratings[book_title])

    # Optional: you can return the average rating or any other response
    return jsonify(success=True, average_rating=average_rating)

if __name__ == '__main__':
    app.run(debug=True)
