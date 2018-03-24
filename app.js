const express = require('express');
const cookieParser = require('cookie-parser');
var app = express();

const server = require('http').createServer(app);
const io = require('./mes_modules/chat_socket').listen(server);

app.use(cookieParser());

app.use(express.static('public'));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs'); // générateur de template
const MongoClient = require('mongodb').MongoClient;

const ObjectID = require('mongodb').ObjectID;

const util = require("util");

app.use(express.static('public'));
const i18n = require('i18n');
i18n.configure({
	locales : ['fr', 'en'],
	cookie : 'langueChoisie',
	directory : __dirname + '/locales' });

app.use(i18n.init);

let db

const peupler = require("./mes_modules/peupler/index.js");

app.get('/:lang(en|fr)', function (req, res) {
	console.log("req.params.local = " + req.params.lang)
	res.cookie('langueChoisie', req.params.lang)
	res.setLocale(req.params.lang)
	console.log(res.__('courriel'))
	res.redirect('back');
});

app.get('/', function (req, res) {
	console.log("req.cookies.langueChoisie = " + req.cookies.langueChoisie)
	console.log(res.__('courriel'))
	res.render('accueil.ejs')
});

app.get('/adresse', function (req, res) {
	var cursor = db.collection('adresse').find().toArray(function(err, resultat){
		if (err) return console.log(err)
		var util = require("util");
 		console.log('util = ' + util.inspect(resultat));
		res.render('composants/adresses.ejs', {adresses: resultat})
	}) 
})

app.get('/formulaire', function (req, res) {
	res.render('gabarit-formulaire.ejs');
})

app.post('/ajouter', (req, res) => {
	console.log(req.body._id)
	if(req.body._id ==""){
		console.log("nouveau");
		let objet ={
			nom:req.body.nom,
			prenom:req.body.prenom,
			courriel: req.body.courriel,
			telephone:req.body.telephone
		}
		db.collection('adresse').save(objet, (err, result) => {
		if (err) return console.log(err)
			console.log('sauvegarder dans la BD')
			res.redirect('/adresse')
		})
	}else{
		console.log("modifier");
		let objet = {
			_id: ObjectID(req.body._id),
			nom:req.body.nom,
			prenom:req.body.prenom,
			courriel: req.body.courriel,
			telephone:req.body.telephone
		}
		db.collection('adresse').save(objet, (err, result) => {
		if (err) return console.log(err)
		console.log('sauvegarder dans la BD')
		res.redirect('/adresse')
	})
	}
	
})

app.get('/delete/:id', (req, res) => {
	var id = req.params.id 
	var critere = ObjectID(req.params.id)
	console.log(critere)

	console.log(id)
	db.collection('adresse').findOneAndDelete({"_id": critere}, (err, resultat) => {
		if (err) return console.log(err)
		res.redirect('/adresse')
	})
})

app.get('/trier/:cle/:ordre', (req, res) => {
	let cle = req.params.cle
	let ordre = (req.params.ordre == 'asc' ? 1 : -1)
	let cursor = db.collection('adresse').find().sort(cle,ordre).toArray(function(err, resultat){
		ordre = (req.params.ordre == 'asc' ? 'desc' : 'asc')
		res.render('composants/adresses.ejs', {adresses: resultat, cle, ordre})
	})
})

app.get('/peupler', (req,res) => {
	res.resultat = peupler(); 
	console.log('début boucle') 
	for (let elm of res.resultat) {
		db.collection('adresse').save(elm, (err, result) => {
		if (err) return console.log(err)
	 	console.log('sauvegarder dans la BD')
		})
	}
	console.log('fin boucle')
	res.redirect('/adresse')
})

app.get('/vider', (req, res) => {
	db.collection('adresse').drop();
 	res.redirect('/adresse');
})

app.get('/chat', (req, res) => {
	res.render('socket_vue.ejs');
})

app.post('/ajax_sauver', (req,res) => {
	req.body._id = ObjectID(req.body._id)

	db.collection('adresse').save(req.body, (err, result) => {
		if (err) return console.log(err)
   		console.log('sauvegarder dans la BD')
		res.send(JSON.stringify(req.body));
	})
})

MongoClient.connect('mongodb://127.0.0.1:27017', (err, database) => {
	if (err) return console.log(err)
	db = database.db('carnet_adresse')
	server.listen(8081, () => {
		console.log('connexion à la BD et on écoute sur le port 8081')
	})
})