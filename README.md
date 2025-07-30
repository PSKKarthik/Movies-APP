# MovieApp

A modern web application to discover, search, and manage movies using The Movie Database (TMDb) API.

## Features
- Browse popular, trending, and top-rated movies
- Search for movies by title
- Filter by genre, year, language, and rating
- View detailed movie info, trailers, cast, and reviews
- Add movies to your favorites and watchlist (local storage)
- User authentication (demo, insecure: local storage only)
- Leave and view local reviews for movies
- Infinite scroll for movie lists
- Dark mode and language toggle (English, Hindi, Telugu)
- Responsive design

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, etc.)
- [TMDb API Key](https://www.themoviedb.org/settings/api) (already included for demo)

### Installation
1. Clone this repository:
   ```powershell
   git clone https://github.com/PSKKarthik/Movies-APP.git
   ```
2. Open the project folder in VS Code or your preferred editor.
3. Open `movieapp.html` in your browser to run the app.

### File Structure
- `movieapp.html` — Main HTML file
- `movieapp.js` — Application logic (API calls, UI, authentication, etc.)
- `movieapp.css` — Styles

## Usage
- Use the search bar to find movies.
- Filter results using the controls at the top.
- Click a movie for details, trailer, reviews, and related movies.
- Log in or register (demo only) to use favorites, watchlist, and leave reviews.
- Toggle dark mode and language using the buttons.

## Security Warning
**Do NOT use real passwords.** This app stores user data in local storage and exposes the TMDb API key in client-side JS. For production, use a secure backend for authentication and API requests.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is for educational/demo purposes. See [TMDb terms of use](https://www.themoviedb.org/documentation/api/terms-of-use) for API usage.

## Credits
- [TMDb](https://www.themoviedb.org/) for movie data and images
- Built by PSKKarthik
