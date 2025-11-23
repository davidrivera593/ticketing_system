import psycopg2
from psycopg2 import sql
from faker import Faker
import random
from dotenv import load_dotenv
import os
import bcrypt

load_dotenv()

connection_string = os.getenv("DATABASE_URL")
# Initialize Faker
fake = Faker()

# Connect to PostgreSQL server
try:
    conn = psycopg2.connect(connection_string)
    cursor = conn.cursor()

    # Generate and insert fake data for Users table
    roles = ['student', 'TA', 'admin']
    password = 'test'
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    for _ in range(20):  # Generate 20 users
        name = fake.name()
        email = fake.email()
        role = random.choice(roles)
        cursor.execute(
            "INSERT INTO Users (name, email, role, password) VALUES (%s, %s, %s, %s)",
            (name, email, role, hashed_password)
        )

    # Generate and insert fake data for Teams table
    for _ in range(5):  # Generate 5 teams
        team_name = fake.company()
        cursor.execute(
            "INSERT INTO Teams (team_name) VALUES (%s)",
            (team_name,)
        )

    # Generate and insert fake data for TeamMembers table
    cursor.execute("SELECT user_id FROM Users WHERE role = 'student'")
    student_ids = [row[0] for row in cursor.fetchall()]
    cursor.execute("SELECT team_id FROM Teams")
    team_ids = [row[0] for row in cursor.fetchall()]

    for student_id in student_ids:
        team_id = random.choice(team_ids)
        cursor.execute(
            "INSERT INTO TeamMembers (team_id, student_id) VALUES (%s, %s)",
            (team_id, student_id)
        )

    # Generate and insert fake data for Tickets table
    issue_types = ['Bug', 'Feature Request', 'Question', 'Other']
    statuses = ['new', 'ongoing', 'resolved']
    for _ in range(10):  # Generate 10 tickets
        student_id = random.choice(student_ids)
        team_id = random.choice(team_ids)
        issue_description = fake.text()
        issue_type = random.choice(issue_types)
        status = random.choice(statuses)
        cursor.execute(
            "INSERT INTO Tickets (student_id, team_id, issue_description, issue_type, status) VALUES (%s, %s, %s, %s, %s)",
            (student_id, team_id, issue_description, issue_type, status)
        )

    # Generate and insert fake data for TicketAssignments table
    cursor.execute("SELECT user_id FROM Users WHERE role = 'TA'")
    ta_ids = [row[0] for row in cursor.fetchall()]
    cursor.execute("SELECT ticket_id FROM Tickets")
    ticket_ids = [row[0] for row in cursor.fetchall()]

    for ticket_id in ticket_ids:
        ta_id = random.choice(ta_ids)
        cursor.execute(
            "INSERT INTO TicketAssignments (ticket_id, ta_id) VALUES (%s, %s)",
            (ticket_id, ta_id)
        )

    # Generate and insert fake data for TicketCommunications table
    for _ in range(30):  # Generate 30 communications
        ticket_id = random.choice(ticket_ids)
        user_id = random.choice(student_ids + ta_ids)
        message = fake.text()
        cursor.execute(
            "INSERT INTO TicketCommunications (ticket_id, user_id, message) VALUES (%s, %s, %s)",
            (ticket_id, user_id, message)
        )

    # Commit changes and close cursor and connection
    conn.commit()
    cursor.close()
    conn.close()

    print("Fake data inserted successfully!")

except Exception as err:
    print(f"Error: {err}")
