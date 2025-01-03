const mongoose = require('mongoose')
const Document = require('../models/Document')

  mongoose.connect("mongodb://localhost:27017/irisdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
const defaultValue = '';

const io = require('socket.io')(3001, {
    cors : {
        origin : 'http://localhost:3000',
        methods : ['GET', 'POST']
    },
}
);

io.on("connection", socket => {
    socket.on('get-document', async documentId => {
        const document = await find_or_create(documentId);
        socket.join(documentId);
        socket.emit('load-document', document.data);
        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        })
        socket.on('save-document', async data => {
            await Document.findByIdAndUpdate(documentId, {data});
        })
    })
})


async function find_or_create(id)
{
    if (id == null) return 
    
    const document = await Document.findById(id)
    if (document) return document 
    return await Document.create({_id : id, data: defaultValue})
}
