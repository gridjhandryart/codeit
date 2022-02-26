
// change pushing state

let pendingPromise;

function changePushingState(to, pendingPromise) {

  if (to === true) {

    pendingPromise = pendingPromise ?? null;
    
    window.addEventListener('beforeunload', beforeUnloadListener, {capture: true});

  } else {

    pendingPromise = null;
    
    window.removeEventListener('beforeunload', beforeUnloadListener, {capture: true});

  }

}

const beforeUnloadListener = (event) => {

  event.preventDefault();
  return event.returnValue = 'Are you sure you want to exit?';

};


let git = {

  // get a blob
  'getBlob': async (treeLoc, sha) => {

    // map tree location
    let query = 'https://api.github.com';
    const [user, repo] = treeLoc;
    
    // get repository branch
    let [repoName, branch] = repo.split(':');

    if (branch) branch = '?ref='+ branch;
    else branch = '';

    query += '/repos/'+ user +'/'+ repoName +'/git/blobs/'+ sha + branch;

    // get the query
    const resp = await axios.get(query, gitToken);

    return resp;

  },

  // get a file
  'getFile': async (treeLoc, fileName) => {

    // map tree location
    let query = 'https://api.github.com';
    const [user, repo, contents] = treeLoc;

    // get repository branch
    let [repoName, branch] = repo.split(':');

    if (branch) branch = '?ref='+ branch;
    else branch = '';

    query += '/repos/' + user + '/' + repoName +
             '/contents/' + contents
             + '/' + fileName +
             branch;

    // get the query
    const resp = await axios.get(query, gitToken);

    return resp;

  },

  // get items in tree
  'getItems': async (treeLoc) => {

    // map tree location
    let query = 'https://api.github.com';
    const [user, repo, contents] = treeLoc;

    // if navigating in repository
    if (repo != '') {

      // get repository branch
      let [repoName, branch] = repo.split(':');

      if (branch) branch = '?ref='+ branch;
      else branch = '';

      query += '/repos/' + user + '/' + repoName +
               '/contents' + contents +
               branch;

    } else { // else, show all repositories

      query += '/user/repos?visibility=all&sort=updated&per_page=100&page=1';

    }

    // get the query
    const resp = await axios.get(query, gitToken);

    return resp;

  },
  
  // check if user has push access in repository
  'checkPushAccess': async (treeLoc, userToCheck) => {
    
    // map tree location
    let query = 'https://api.github.com';
    const [user, repo] = treeLoc;
    
    const [repoName] = repo.split(':');
    
    query += '/repos/' + user + '/' + repoName + '/collaborators/' + userToCheck + '/permission';
    
    // get the query
    const resp = await axios.get(query, gitToken);
    
    if (resp.message &&
        resp.message.startsWith('Must have push access')) {
      
      return false;
      
    } else {
      
      return true;
      
    }
    
  },
  
  // list branches for repository
  'getBranches': async (treeLoc) => {

    // map tree location
    let query = 'https://api.github.com';
    const [user, repo] = treeLoc;

    const [repoName] = repo.split(':');

    query += '/repos/'+ user +'/'+ repoName +'/branches';

    // get the query
    const resp = await axios.get(query, gitToken);

    return resp;

  },
  
  // get a repository
  'getRepo': async (treeLoc) => {

    // map tree location
    let query = 'https://api.github.com';
    const [user, repo] = treeLoc;
    
    // get repository branch
    const [repoName, branch] = repo.split(':');
    
    query += '/repos/' + user + '/' + repoName;
    
    // get the query
    const resp = await axios.get(query, gitToken);

    return resp;
    
  },

  // push a file
  'push': async (commit) => {

    // map file location in tree
    const [user, repo, contents] = commit.file.dir.split(',');

    // get repository branch
    let [repoName, branch] = repo.split(':');

    const query = 'https://api.github.com/repos' +
                  '/' + user + '/' + repoName +
                  '/contents' + contents +
                  '/' + commit.file.name;

    let commitData;

    if (commit.file.sha) {

      commitData = {
        message: commit.message,
        content: commit.file.content,
        sha: commit.file.sha,
        branch: branch
      };

    } else {

      commitData = {
        message: commit.message,
        content: commit.file.content,
        branch: branch
      };

    }
    
    
    // if there's a pending promise, await it
    if (pendingPromise) await pendingPromise;
    

    // change pushing state
    changePushingState(true);

    // put the query
    const resp = await axios.put(query, gitToken, commitData);

    // change pushing state
    changePushingState(false);

    return resp.content.sha;

  },

  // create a repository
  'createRepo': async (repoName, private) => {

    const query = 'https://api.github.com/user/repos';

    const repoData = {
      name: repoName,
      private: private,
      has_wiki: false,
      auto_init: true
    };
    
    
    // post the query
    
    // create promise
    const pendingPromise = axios.post(query, gitToken, repoData);
    
    // change pushing state
    changePushingState(true, pendingPromise);
    
    // await promise
    const resp = await pendingPromise;

    // change pushing state
    changePushingState(false);
    
    return resp.full_name;

  },
  
  // create a branch
  'createBranch': async (treeLoc, shaToBranchFrom, newBranchName) => {

    // map tree location
    let query = 'https://api.github.com';
    const [user, repo] = treeLoc;
    
    const [repoName] = repo.split(':');
        
    query += '/repos/'+ user +'/'+ repoName +'/git/refs';

    // create new branch
    const branchData = {
      ref: 'refs/heads/' + newBranchName,
      sha: shaToBranchFrom
    };
    
    // change pushing state
    changePushingState(true);

    // post the query
    const resp = await axios.post(query, branchData, gitToken);

    // change pushing state
    changePushingState(false);
    
    return resp;

  },
  
  // fork a repository
  'forkRepo': async (treeLoc) => {

    // map tree location
    const [user, repo] = treeLoc;

    const query = 'https://api.github.com/repos' +
                  '/' + user + '/' + repo + '/forks';

    // change pushing state
    changePushingState(true);
    
    // post the query
    const resp = await axios.post(query, gitToken);

    // change pushing state
    changePushingState(false);
    
    return resp.full_name;
    
    // change treeLoc to fork dir, change all the repo's modified files' dir to the fork's dir, and push modified files in dir. 

  },
  
  // invite a user to a repository
  'sendInviteToRepo': async (treeLoc, usernameToInvite) => {

    // map tree location
    const [user, repo] = treeLoc;

    const query = 'https://api.github.com/repos' +
                  '/' + user + '/' + repo +
                  '/collaborators/' + usernameToInvite;

    // change pushing state
    changePushingState(true);
    
    // put the query
    const resp = await axios.put(query, gitToken);

    // change pushing state
    changePushingState(false);
    
    return resp.node_id;

  },
  
  // accept an invitation to a repository
  'acceptInviteToRepo': async (treeLoc) => {

    // map tree location
    const [user, repo] = treeLoc;
    
    let query = 'https://api.github.com/user' +
                '/repository_invitations';

    // get the query
    const invites = await axios.get(query, gitToken);

    // find repo invite
    let repoInvite = invites.filter(invite =>
                                      invite.repository.full_name ===
                                      (user + '/' + repo)
                                   );
    
    // if invite exists
    if (repoInvite) {
      
      // accept invite
      query += '/' + repoInvite.node_id;
      
      // patch the query
      const resp = await axios.patch(query, gitToken);
      
      return true;
      
    } else {
      
      return false;
      
    }

  },
  
  // delete a repository
  'deleteRepo': async (treeLoc) => {

    // map tree location
    const [user, repo] = treeLoc;
    
    const query = 'https://api.github.com/user/repos' +
                  '/' + user + '/' + repo;
    
    // dispatch request with query
    const resp = await axios.delete(query, gitToken);
    
    return true;

  }

};
