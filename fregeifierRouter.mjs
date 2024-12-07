// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: fregeifierRouter.mjs
// exports the router that can be mounted on an ExpressJS server
// to host the fregeifier web interface

import express from 'express';
import path from 'node:path';
import jsonResponse from './js/jsonResponse.mjs';
import {fileURLToPath} from 'node:url';
import fs from './js/fs.mjs';

// get script directory
const __fregeifierfilename = fileURLToPath(import.meta.url);
const __fregeifierdirname = path.dirname(__fregeifierfilename);
process.__fregeifierdirname = __fregeifierdirname;

const router = express.Router();

router.use('/fregeifier/public', express.static(
  path.join(__fregeifierdirname, 'public')
));

router.use('/fregeifier/reverse', async function(req, res) {
  const s = req?.query?.s;
  if (!s || s.length > 120) {
    res.status(401).type('txt').send('Error 401 Invalid Request');
    return;
  }
  const r = s.split('').reverse().join('');
  res.type('txt').send(r);
});

router.get('/fregeifier', async function(req, res) {
  res.sendFile(path.join(__fregeifierdirname, 'public', 'index.html'));
});

router.get('/fregeifier/index.html', async function(req, res) {
  res.sendFile(path.join(__fregeifierdirname, 'public', 'index.html'));
});

router.get('/fregeifier/processed/:filename', async function(req, res) {
  // TODO
  const tempkey = req?.query?.tempkey;
  if (!tempkey) {
    res.status(404).type('txt').send('Error 404 Not Found');
    return;
  }
  if (!process.fregeifierDatadir) {
    res.status(404).type('txt').send('Error 404 Not Found');
    return;
  }
  const fullpath = path.join(
    process.fregeifierDatadir,
    'temporary',
    tempkey,
    'images',
    req?.params?.filename ?? 'meinong.png'
  );
  if (!fs.isfile(fullpath)) {
    res.status(404).type('txt').send('Error 404 Not Found');
    return;
  }
  if (req?.query?.dl === 'true') {
    res.download(fullpath);
    return;
  }
  res.sendFile(fullpath);
});

router.use('/fregeifier/response', express.json({limit: '10mb'}));
router.post('/fregeifier/response', async function(req, res) {
  const respObj = jsonResponse(req.body);
  res.json(respObj);
});

export default router;
