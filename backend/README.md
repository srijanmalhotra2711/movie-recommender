# Movie Recommender - Backend API

AI-Powered movie recommendation system using hybrid collaborative and content-based filtering.

## Features

- **Hybrid Recommendation Engine**: Combines collaborative filtering and content-based filtering
- **User Authentication**: JWT-based authentication
- **Movie Database**: Browse and search movies with ratings
- **Personalized Recommendations**: Get recommendations based on your taste
- **A/B Testing Ready**: Multiple algorithm options for experimentation
- **RESTful API**: Well-documented API with automatic Swagger docs

## Tech Stack

- **FastAPI**: Modern, fast web framework
- **PostgreSQL**: Relational database
- **SQLAlchemy**: ORM for database operations
- **scikit-surprise**: Collaborative filtering
- **sentence-transformers**: Content-based embeddings
- **JWT**: Secure authentication

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL database
- pip or conda

### Installation

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set up database**:
Create a PostgreSQL database:
```sql
CREATE DATABASE movie_recommender;
```

3. **Configure environment**:
Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and secret key.

4. **Load data**:
Download MovieLens dataset and populate database:
```bash
python load_data.py
```

This will:
- Download MovieLens small dataset
- Create database tables
- Load movies, genres, and ratings
- Create 10 demo users (user1-user10, password: password123)

5. **Initialize embeddings** (optional, can also be done via API):
After starting the server, call the initialization endpoint or the embeddings will be generated on first use.

## Running the Server

### Development mode:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production mode:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/validate` - Validate token

### Movies
- `GET /api/movies/` - List movies (with pagination, search, filters)
- `GET /api/movies/{id}` - Get movie details
- `GET /api/movies/search` - Search movies
- `GET /api/movies/genres` - List all genres
- `GET /api/movies/popular/top` - Get popular movies

### Ratings
- `POST /api/ratings/` - Rate a movie
- `PUT /api/ratings/{id}` - Update rating
- `DELETE /api/ratings/{id}` - Delete rating
- `GET /api/ratings/my-ratings` - Get your ratings
- `GET /api/ratings/movie/{id}/stats` - Get movie rating stats

### Recommendations
- `GET /api/recommendations/` - Get personalized recommendations
- `GET /api/recommendations/similar/{id}` - Get similar movies
- `POST /api/recommendations/initialize-embeddings` - Initialize content embeddings
- `GET /api/recommendations/stats` - Get recommendation stats

## Recommendation Algorithms

The system supports multiple recommendation algorithms:

1. **Hybrid** (default): Combines collaborative and content-based filtering with weighted scores
2. **Collaborative**: User-based collaborative filtering using cosine similarity
3. **Content**: Content-based filtering using movie features and embeddings
4. **Adaptive**: Automatically chooses algorithm based on user's rating count
5. **Popular**: Returns popular movies (used for cold start)

## Demo Users

The data loading script creates 10 demo users:
- Username: `user1` to `user10`
- Password: `password123`

These users have existing ratings from the MovieLens dataset distributed among them.

## Development

### Project Structure
```
backend/
├── app/
│   ├── api/              # API routes
│   ├── core/             # Core utilities (security, etc.)
│   ├── models/           # Database models and schemas
│   ├── recommenders/     # Recommendation engines
│   ├── config.py         # Configuration
│   ├── database.py       # Database connection
│   └── main.py           # FastAPI application
├── data/                 # MovieLens data (downloaded)
├── load_data.py          # Data loading script
└── requirements.txt      # Python dependencies
```

### Adding New Features

1. **New endpoints**: Add routes in `app/api/`
2. **New models**: Add to `app/models/database.py`
3. **New schemas**: Add to `app/models/schemas.py`
4. **New recommendation algorithms**: Implement in `app/recommenders/`

## Troubleshooting

### Database connection errors
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists

### Import errors
- Make sure you're in the backend directory
- Ensure all dependencies are installed
- Python path should include the backend directory

### Slow recommendations
- Run embedding initialization: `POST /api/recommendations/initialize-embeddings`
- Embeddings are generated on first use, which can take time
- Consider using smaller dataset for development

## Performance Optimization

For production:
1. Pre-generate all embeddings
2. Use connection pooling
3. Add Redis caching for recommendations
4. Use async database queries
5. Deploy with multiple workers

## License

MIT
