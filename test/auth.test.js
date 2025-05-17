const server = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiHttp);

describe('Authentication Tests', () => {
    // Test user registration
    describe('POST /api/authenticate/register', () => {
        it('should register a new user with valid details', (done) => {
            const newUser = {
                email: `test${Date.now()}@test.com`,
                password: 'Test@123',
                name: 'Test User'
            };
            
            chai.request(server)
                .post('/api/authenticate/register')
                .send(newUser)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('token');
                    done();
                });
        });

        it('should not register user with existing email', (done) => {
            const existingUser = {
                email: 'pratap123@email.com',
                password: 'Test@123',
                name: 'Test User'
            };
            
            chai.request(server)
                .post('/api/authenticate/register')
                .send(existingUser)
                .end((err, res) => {
                    res.should.have.status(400);
                    done();
                });
        });

        it('should not register user with invalid email format', (done) => {
            const invalidUser = {
                email: 'invalid-email',
                password: 'Test@123',
                name: 'Test User'
            };
            
            chai.request(server)
                .post('/api/authenticate/register')
                .send(invalidUser)
                .end((err, res) => {
                    res.should.have.status(400);
                    done();
                });
        });
    });

    // Test user login
    describe('POST /api/authenticate/login', () => {
        it('should login user with valid credentials', (done) => {
            const validUser = {
                email: 'pratap123@email.com',
                password: 'pratap'
            };
            
            chai.request(server)
                .post('/api/authenticate/login')
                .send(validUser)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('token');
                    done();
                });
        });

        it('should not login with incorrect password', (done) => {
            const invalidPass = {
                email: 'pratap123@email.com',
                password: 'wrongpassword'
            };
            
            chai.request(server)
                .post('/api/authenticate/login')
                .send(invalidPass)
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });

        it('should not login with non-existent email', (done) => {
            const nonExistentUser = {
                email: 'nonexistent@email.com',
                password: 'password123'
            };
            
            chai.request(server)
                .post('/api/authenticate/login')
                .send(nonExistentUser)
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });
    });

    // Test token validation
    describe('Token Validation', () => {
        let validToken;

        before((done) => {
            chai.request(server)
                .post('/api/authenticate/login')
                .send({
                    email: 'pratap123@email.com',
                    password: 'pratap'
                })
                .end((err, res) => {
                    validToken = res.body.token;
                    done();
                });
        });

        it('should access protected route with valid token', (done) => {
            chai.request(server)
                .get('/api/user')
                .set('authtoken', validToken)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('should not access protected route without token', (done) => {
            chai.request(server)
                .get('/api/user')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });

        it('should not access protected route with invalid token', (done) => {
            chai.request(server)
                .get('/api/user')
                .set('authtoken', 'invalid_token')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
}); 