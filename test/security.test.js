const server = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiHttp);

describe('Security Tests', () => {
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

    // SQL Injection Tests
    describe('SQL Injection Prevention', () => {
        it('should handle SQL injection attempts in login', (done) => {
            const maliciousPayload = {
                email: "' OR '1'='1",
                password: "' OR '1'='1"
            };

            chai.request(server)
                .post('/api/authenticate/login')
                .send(maliciousPayload)
                .end((err, res) => {
                    res.should.have.status(400);
                    done();
                });
        });
    });

    // XSS Prevention Tests
    describe('XSS Prevention', () => {
        it('should sanitize post content with XSS payload', (done) => {
            const xssPayload = {
                title: '<script>alert("xss")</script>',
                description: '<img src="x" onerror="alert(\'xss\')">'
            };

            chai.request(server)
                .post('/api/posts')
                .set('authtoken', validToken)
                .send(xssPayload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.title.should.not.include('<script>');
                    res.body.description.should.not.include('onerror');
                    done();
                });
        });
    });

    // CSRF Protection Tests
    describe('CSRF Protection', () => {
        it('should reject requests without proper headers', (done) => {
            chai.request(server)
                .post('/api/posts')
                .set('authtoken', validToken)
                .set('origin', 'http://malicious-site.com')
                .send({ title: 'Test', description: 'Test' })
                .end((err, res) => {
                    res.should.have.status(403);
                    done();
                });
        });
    });

    // Rate Limiting Tests
    describe('Rate Limiting', () => {
        it('should limit repeated requests', (done) => {
            const requests = [];
            for(let i = 0; i < 100; i++) {
                requests.push(
                    chai.request(server)
                        .post('/api/authenticate/login')
                        .send({
                            email: 'pratap123@email.com',
                            password: 'pratap'
                        })
                );
            }

            Promise.all(requests.map(p => p.catch(e => e)))
                .then(responses => {
                    const tooManyRequests = responses.some(res => res.status === 429);
                    tooManyRequests.should.be.true;
                    done();
                });
        });
    });

    // Password Security Tests
    describe('Password Security', () => {
        it('should reject weak passwords', (done) => {
            const weakPassword = {
                email: 'test@test.com',
                password: '123',
                name: 'Test User'
            };

            chai.request(server)
                .post('/api/authenticate/register')
                .send(weakPassword)
                .end((err, res) => {
                    res.should.have.status(400);
                    done();
                });
        });
    });

    // Authorization Tests
    describe('Authorization Checks', () => {
        let userAToken;
        let userBToken;
        let userAPost;

        before(async () => {
            // Create two users
            const userAResponse = await chai.request(server)
                .post('/api/authenticate/register')
                .send({
                    email: `userA${Date.now()}@test.com`,
                    password: 'TestA@123',
                    name: 'User A'
                });
            userAToken = userAResponse.body.token;

            const userBResponse = await chai.request(server)
                .post('/api/authenticate/register')
                .send({
                    email: `userB${Date.now()}@test.com`,
                    password: 'TestB@123',
                    name: 'User B'
                });
            userBToken = userBResponse.body.token;

            // Create a post as User A
            const postResponse = await chai.request(server)
                .post('/api/posts')
                .set('authtoken', userAToken)
                .send({
                    title: 'User A Post',
                    description: 'This is User A post'
                });
            userAPost = postResponse.body._id;
        });

        it('should prevent user B from deleting user A post', (done) => {
            chai.request(server)
                .delete(`/api/posts/${userAPost}`)
                .set('authtoken', userBToken)
                .end((err, res) => {
                    res.should.have.status(403);
                    done();
                });
        });
    });
}); 