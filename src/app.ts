import express from 'express'

const app = express()

app.use(express.json())

app.get('/', (_, res) => {
    res.status(200).json({"hello": "world"});
})

app.listen(3000, () => {
    console.log('running app on 3000')
});
