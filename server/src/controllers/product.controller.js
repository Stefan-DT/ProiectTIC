const getAllProducts = (req, res) => {
    res.status(200).json({
      message: 'Lista de produse este mare si numeroasa...',
      data: []
    });
  };
  
  module.exports = {
    getAllProducts
  };
  