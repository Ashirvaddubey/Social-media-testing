const server = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiHttp);

describe('Posts API Tests', () => {
    let authToken;
    let createdPostId;

    // Login before tests
    before((done) => {
        chai.request(server)
            .post('/api/authenticate/login')
            .send({
                email: 'pratap123@email.com',
                password: 'pratap'
            })
            .end((err, res) => {
                authToken = res.body.token;
                done();
            });
    });

    // Test post creation
    describe('POST /api/posts', () => {
        it('should create a new post with valid data', (done) => {
            const newPost = {
                title: 'Test Post',
                description: 'This is a test post description'
            };

            const startTime = Date.now();
            
            chai.request(server)
                .post('/api/posts')
                .set('authtoken', authToken)
                .send(newPost)
                .end((err, res) => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;

                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('_id');
                    createdPostId = res.body._id;

                    // Performance assertion
                    responseTime.should.be.below(1000); // Response time should be under 1 second
                    done();
                });
        });

        it('should handle concurrent post creation (stress test)', (done) => {
            const numberOfRequests = 10;
            let completedRequests = 0;
            const responseTimes = [];

            for(let i = 0; i < numberOfRequests; i++) {
                const newPost = {
                    title: `Stress Test Post ${i}`,
                    description: `This is stress test post ${i}`
                };

                const startTime = Date.now();

                chai.request(server)
                    .post('/api/posts')
                    .set('authtoken', authToken)
                    .send(newPost)
                    .end((err, res) => {
                        const endTime = Date.now();
                        responseTimes.push(endTime - startTime);

                        completedRequests++;
                        if(completedRequests === numberOfRequests) {
                            // Calculate average response time
                            const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
                            avgResponseTime.should.be.below(2000); // Average response time should be under 2 seconds
                            done();
                        }
                    });
            }
        });
    });

    // Test post retrieval
    describe('GET /api/posts/:id', () => {
        it('should retrieve post by id with valid performance', (done) => {
            const startTime = Date.now();

            chai.request(server)
                .get(`/api/posts/${createdPostId}`)
                .set('authtoken', authToken)
                .end((err, res) => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;

                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    responseTime.should.be.below(500); // Read operations should be faster
                    done();
                });
        });
    });

    // Test post update
    describe('PUT /api/posts/:id', () => {
        it('should update post with valid data and measure performance', (done) => {
            const updateData = {
                title: 'Updated Test Post',
                description: 'This is an updated test post description'
            };

            const startTime = Date.now();

            chai.request(server)
                .put(`/api/posts/${createdPostId}`)
                .set('authtoken', authToken)
                .send(updateData)
                .end((err, res) => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;

                    res.should.have.status(200);
                    responseTime.should.be.below(1000);
                    done();
                });
        });
    });

    // Test post deletion
    describe('DELETE /api/posts/:id', () => {
        it('should delete post and verify performance', (done) => {
            const startTime = Date.now();

            chai.request(server)
                .delete(`/api/posts/${createdPostId}`)
                .set('authtoken', authToken)
                .end((err, res) => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;

                    res.should.have.status(200);
                    responseTime.should.be.below(1000);
                    done();
                });
        });
    });

    // Test post listing with pagination
    describe('GET /api/all_posts', () => {
        it('should retrieve posts with pagination and measure performance', (done) => {
            const startTime = Date.now();

            chai.request(server)
                .get('/api/all_posts')
                .set('authtoken', authToken)
                .query({ page: 1, limit: 10 })
                .end((err, res) => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;

                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    responseTime.should.be.below(1000);
                    done();
                });
        });
    });
}); 