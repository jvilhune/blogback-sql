//C:\Users\PC\blogback-sql>npm run printBlogs

require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL);

const printBlogs = async () => {
  try {
    const blogs = await sequelize.query('SELECT * FROM blogs', {
      type: QueryTypes.SELECT,
    });

    blogs.forEach((blog) => {
      console.log(`${blog.title}, ${blog.author}, ${blog.url}, ${blog.likes}`);
    });

    sequelize.close();
  } catch (error) {
    console.error(error);
  }
};


module.exports = { printBlogs }
