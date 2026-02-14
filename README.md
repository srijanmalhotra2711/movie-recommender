# AI-Powered Movie Recommendation Engine

A Netflix-style movie recommendation system built with hybrid filtering methods (collaborative + content-based). Features a full-stack implementation with FastAPI backend and Next.js frontend, deployed on AWS with A/B testing capabilities.

![Project Status](https://img.shields.io/badge/status-in%20development-yellow)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

## 🎯 Project Overview

This project demonstrates a complete recommendation system implementation suitable for portfolio showcase. It combines multiple machine learning techniques to provide personalized movie recommendations.

### Key Features

- **Hybrid Recommendation Engine**
  - Collaborative filtering (user-based similarity)
  - Content-based filtering (movie feature embeddings)
  - Weighted hybrid approach
  - Adaptive algorithm selection

- **Full-Stack Application**
  - RESTful API with FastAPI
  - React/Next.js frontend
  - PostgreSQL database
  - JWT authentication

- **Production-Ready Features**
  - A/B testing framework
  - User rating system
  - Movie search and filtering
  - Real-time recommendations
  - Cold start handling

- **Scalable Architecture**
  - Serverless deployment (AWS Lambda)
  - Cloud database (RDS)
  - CDN integration
  - Monitoring and logging

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Gateway   │
│   (FastAPI)     │
└────────┬────────┘
         │
         ├──────────┐
         ▼          ▼
┌─────────────┐  ┌──────────────────┐
│  PostgreSQL │  │  Recommendation  │
│  Database   │  │  Engine          │
└─────────────┘  └──────────────────┘
                          │
                          ├── Collaborative
                          ├── Content-Based
                          └── Hybrid
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL 14+
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd movie-recommender
```

2. **Set up backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
python load_data.py
python run.py server
```

3. **Set up frontend** (in a new terminal)
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your API URL
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Demo credentials: username: `user1`, password: `password123`

## 📁 Project Structure

```
movie-recommender/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # Database models
│   │   ├── recommenders/   # Recommendation engines
│   │   └── core/           # Core utilities
│   ├── data/               # MovieLens dataset
│   ├── load_data.py        # Data loading script
│   └── requirements.txt
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   └── package.json
│
└── README.md
```

## 🎓 Skills Demonstrated

### Machine Learning
- Collaborative filtering (matrix factorization, user similarity)
- Content-based filtering (embeddings, feature extraction)
- Hybrid recommendation systems
- Cold start problem handling
- Model evaluation metrics

### Backend Development
- RESTful API design
- JWT authentication
- Database modeling (SQLAlchemy ORM)
- Async programming
- API documentation (OpenAPI/Swagger)

### Frontend Development
- React/Next.js
- State management
- API integration
- Responsive design
- User authentication flow

### DevOps & Cloud
- AWS deployment (Lambda, RDS, S3, CloudFront)
- Serverless architecture
- Database migrations
- Environment configuration
- CI/CD principles

### Data Engineering
- ETL processes
- Data preprocessing
- Feature engineering
- Vector embeddings

## 🔬 Recommendation Algorithms

### 1. Collaborative Filtering
Uses user-item interaction patterns to find similar users and recommend movies they liked.

**Pros**: Discovers new preferences, no feature engineering
**Cons**: Cold start problem, sparsity issues

### 2. Content-Based Filtering
Analyzes movie features (genres, descriptions) to recommend similar content.

**Pros**: No cold start for items, interpretable
**Cons**: Limited diversity, requires feature engineering

### 3. Hybrid Approach
Combines both methods with weighted scores for best results.

**Configuration**: 60% collaborative + 40% content-based (adjustable)

## 📊 Dataset

Uses the [MovieLens](https://grouplens.org/datasets/movielens/) dataset:
- **Small**: 100,000 ratings, 9,000 movies (development)
- **25M**: 25 million ratings, 62,000 movies (production option)

## 🧪 A/B Testing

The system supports testing different recommendation algorithms:

```python
GET /api/recommendations/?algorithm=hybrid    # Default
GET /api/recommendations/?algorithm=collaborative
GET /api/recommendations/?algorithm=content
GET /api/recommendations/?algorithm=adaptive
```

Track metrics:
- Click-through rate
- Rating conversion
- User engagement
- Algorithm preference

## 🔧 Development Phases

- [x] **Phase 1 + 2**: Backend with hybrid recommendations ✅
- [ ] **Phase 3**: Frontend development
- [ ] **Phase 4**: AWS deployment
- [ ] **Phase 5**: A/B testing implementation

## 📈 Future Enhancements

- Matrix factorization (SVD, ALS)
- Deep learning models (Neural Collaborative Filtering)
- Real-time recommendations with streaming data
- Multi-armed bandit algorithms
- Explainable AI features
- Social features (friend recommendations)

## 🤝 Contributing

This is a portfolio project, but suggestions and feedback are welcome!

## 📝 License

MIT License - feel free to use this for learning and portfolio purposes.

## 🙏 Acknowledgments

- MovieLens dataset by GroupLens Research
- FastAPI and Next.js communities
- Inspiration from Netflix, Spotify recommendation systems

---

**Author**: [Your Name]
**Date**: February 2026
**Purpose**: Portfolio project demonstrating full-stack ML engineering skills
