const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const escape = require('escape-html');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const fileExt = file.path.split('.').slice(-1)[0]; // get file extension
      const validExts = ['gif', 'jpg', 'png', 'jpeg'];

      if(validExts.includes(fileExt.toLowerCase()) && title.length <= 25 && author.length <= 50) {
        const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path
        const newPhoto = new Photo({ title: escape(title), author: escape(author), email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong input!');
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const voter = await Voter.findOne({ user: req.clientIp });
      if(!voter) {
        const newVoter = new Voter({ user: req.clientIp, votes: [photoToUpdate._id] });
        await newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      } else {
        if(voter.votes.includes(photoToUpdate._id)) {
          res.status(500).json({ message: 'You already voted for this photo' });
        } else {
          voter.votes.push(photoToUpdate._id);
          await voter.save();
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({ message: 'OK' });
        }
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
