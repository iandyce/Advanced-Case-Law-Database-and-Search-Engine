const express = require('express');
const router = express.Router();

// Route for "Our Mission"
router.get('/mission', (req, res) => {
    res.json({
        title: "Our Mission",
        content: "At Case Law Kenya, our mission is to empower individuals and legal professionals by providing seamless access to comprehensive case law information across Kenya’s counties. We aim to democratize legal knowledge, ensuring that everyone—from law students to seasoned advocates—can easily access, understand, and utilize case law to uphold justice and protect rights. By leveraging technology, we strive to bridge the gap between complex legal systems and the people who need to navigate them, fostering a more informed and equitable society."
    });
});

// Route for "Our Vision"
router.get('/vision', (req, res) => {
    res.json({
        title: "Our Vision",
        content: "We envision a future where legal knowledge is accessible to all, bridging the gap between complex legal systems and the people who need to navigate them. Our goal is to create a platform that not only serves as a repository of case law but also as a tool for education, advocacy, and reform. We see Case Law Kenya becoming the go-to resource for legal professionals, researchers, and citizens alike, promoting transparency in the judicial system and empowering communities to engage with the law in meaningful ways."
    });
});

// Route for "Our Team"
router.get('/team', (req, res) => {
    res.json({
        title: "Our Team",
        content: "Our team at Case Law Kenya is a diverse group of legal experts, technologists, and researchers dedicated to making legal information accessible. Led by our founder, a seasoned lawyer with over 15 years of experience, our team includes software developers who specialize in building user-friendly platforms, legal researchers who ensure the accuracy of our data, and community advocates who work to ensure our platform meets the needs of all Kenyans. Together, we combine our expertise to create a tool that serves both the legal community and the public at large."
    });
});

// Route for "Our Technology"
router.get('/technology', (req, res) => {
    res.json({
        title: "Our Technology",
        content: "Case Law Kenya leverages cutting-edge technology to provide a seamless user experience. Our platform is built on a robust backend using Node.js and Express, ensuring fast and reliable access to case law data. We use Leaflet.js to integrate interactive maps, allowing users to explore cases by county with ease. Our search functionality is powered by advanced algorithms that enable both simple and advanced searches, ensuring users can find the exact information they need. We are constantly innovating, with plans to incorporate AI-driven insights and natural language processing to make legal research even more intuitive."
    });
});


module.exports = router;