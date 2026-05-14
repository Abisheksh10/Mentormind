# MentorMind Career Guidance Platform

## Overview

MentorMind is an AI-powered career guidance platform that helps students analyze skills and gaps, identify career paths, track academic progress, personalized course, project recommendations and job recommendations.

The platform combines a modern React frontend, Spring Boot backend, FastAPI ML microservice, MongoDB database, and multiple machine learning models to deliver intelligent career recommendations.

---

# Features

## Authentication & Security

* JWT-based authentication and authorization
* Secure login and signup system
* Protected API routes
* Role-based access workflows

## Student Profile Management

* Student profile creation and updates
* Academic information tracking
* GPA and credits management
* Skill proficiency tracking
* Career target selection
* Job opportunities fetching

## AI Career Recommendation System

* Career ranking based on skill proficiency
* Personalized career path suggestions
* Skill gap analysis
* Career probability scoring
* Intelligent recommendation workflows

## Course & Project Recommendations

* TF-IDF recommendation engine using Scikit-learn
* Personalized course recommendations
* Personalized project recommendations
* Skill-based matching system
* Content similarity analysis

## Skill Gap Analysis

* Missing skill identification
* Gap priority classification
* High/Medium/Low priority prediction
* Career improvement suggestions

## Machine Learning Models

### TF-IDF Recommendation Engine

* Built using Scikit-learn
* Generates personalized course recommendations
* Generates personalized project recommendations
* Uses text vectorization and similarity scoring

### LightGBM Career Ranking Model

* Career prediction using skill proficiency
* Synthetic dataset training
* Multi-class career classification
* Probability-based career ranking

### RandomForest Gap Priority Model

* Skill gap priority prediction
* Critical skill classification
* Career improvement prioritization
* ML-based recommendation support

---

# Tech Stack

## Frontend

* React.js
* Vite
* JavaScript
* Tailwind CSS
* Axios

## Backend

* Spring Boot
* Spring Security
* JWT Authentication
* REST APIs
* Maven

## Machine Learning Service

* FastAPI
* Python
* Scikit-learn
* LightGBM
* NumPy
* Joblib

## Database

* MongoDB

---

# System Architecture

```text
React Frontend
       |
       v
Spring Boot Backend
       |
       v
FastAPI ML Service
       |
       v
MongoDB Database
```

---

# API Modules

## Authentication APIs

* User registration
* User login
* JWT token generation
* Secure authorization

## Profile APIs

* Save profile
* Update profile
* Fetch student profile
* Career target updates

## ML APIs

* Career prediction
* Skill gap analysis
* Course recommendations
* Project recommendations
* Career feedback logging

---

# Project Structure

```text
MentorMind/
│
├── client/                # React Frontend
├── server/                # Spring Boot Backend
├── ml_service/            # FastAPI ML Service
├── screenshots/           # Project screenshots
├── README.md
└── .gitignore
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/mentormind-career-guidance-platform.git
```

---

# Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# Spring Boot Backend Setup

```bash
cd server
mvn spring-boot:run
```

Backend runs on:

```text
http://localhost:5000
```

---

# FastAPI ML Service Setup

```bash
cd ml_service
pip install -r requirements.txt
uvicorn app:app --reload
```

ML service runs on:

```text
http://localhost:8000
```

---

# Environment Variables

Create:

```text
server/src/main/resources/application.properties
```

Example:

```properties
spring.application.name=server

server.port=5000

spring.data.mongodb.uri=your_mongodb_url

jwt.secret=your_jwt_secret
jwt.expiration=86400000
ml.service.url=your_fastapi_server_url
gemini.api.key=your_gemini_api_key
gemini.model=gemini-2.5-flash
adzuna.app.id=your_adzuna_app_id
adzuna.app.key=your_adzuna_app_key
```

Implemented secure JWT authentication, authorization, and protected REST APIs using Spring Boot and Spring Security.
Developed AI-powered career recommendation workflows based on user skills, proficiency, and academic progress tracking.
Built a TF-IDF recommendation engine using Scikit-learn for personalized course and project suggestions.
Developed a LightGBM multiclass career ranking model using synthetic and real feedback training datasets.
Created a RandomForest-based skill gap prioritization model for intelligent career improvement recommendations.
Integrated FastAPI machine learning microservice with Spring Boot backend for scalable AI prediction pipelines.
Implemented dynamic skill gap analysis with matched skills, missing skills, probability scoring, and career ranking.
Integrated Adzuna Jobs API to fetch real-time job opportunities based on recommended careers and skills.
Built responsive frontend interfaces using React.js, Tailwind CSS, Axios, and reusable component architecture.
Designed scalable MongoDB profile management system for academics, skills, certifications, and career tracking.
Implemented personalized learning recommendations using semantic similarity, text vectorization, and skill matching.
Developed feedback logging workflows for improving career prediction accuracy using user interaction data.

---

# Future Enhancements

* Resume analysis using NLP
* AI chatbot integration
* Real-time notifications
* Admin analytics dashboard
* Deployment using Docker and AWS
* Advanced recommendation pipelines

---

# Author

Abishek S H
