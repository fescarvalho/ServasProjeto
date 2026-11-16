const axios = require('axios'); axios.get('http://localhost:3000/api/masses').then(res => console.log(res.data.data.slice(0, 3))).catch(console.error);
