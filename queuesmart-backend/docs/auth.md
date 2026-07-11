# Notes:

-we should keep things simple and use JWT for auth. 

-not sure if we have to hash passwords, but we can use smt like bcrypt or argon

-we need to remove all temporary auth and routing protection from the frontend and 

-if we decide to use fastapi, the auth stack will probably be:
    fastapi-users 
    SQLAlchemy
    JWT/bcrypt

-if we decide to use node.js, the auth stack will probably be:
    better-auth or passport.js
    JWT
    bcrypt

-alternatively, we could use supabase auth. (i've never personally used this but ive heard good things from a friend). its super fast to set up and handles basically everything. im kinda down to try this one ngl