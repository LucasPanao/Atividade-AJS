// array de usuários cadastrados
let users = JSON.parse(localStorage.getItem('users')) || [];
    
export function configureFakeBackend() {
    let realFetch = window.fetch;
    window.fetch = function (url, opts) {
        return new Promise((resolve, reject) => {
            // simulando a chamada de API..
            setTimeout(() => {

                // autenticando
                if (url.endsWith('/users/authenticate') && opts.method === 'POST') {

                    let params = JSON.parse(opts.body);

                    // verficando se é igual login e senha
                    let filteredUsers = users.filter(user => {
                        return user.username === params.username && user.password === params.password;
                    });

                    if (filteredUsers.length) {
                        // retornar os dados do usuário e um token falso
                        let user = filteredUsers[0];
                        let responseJson = {
                            id: user.id,
                            username: user.username,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            token: 'fake-jwt-token'
                        };
                        resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(responseJson)) });
                    } else {
                        reject('Usuário ou senha incorretos, tente novamente');
                    }

                    return;
                }

                // get users
                if (url.endsWith('/users') && opts.method === 'GET') {
                    if (opts.headers && opts.headers.Authorization === 'Bearer fake-jwt-token') {
                        resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(users))});
                    } else {
                        // retorno caso o token seja nulo ou invalido
                        reject('Unauthorised');
                    }

                    return;
                }

                
                if (url.match(/\/users\/\d+$/) && opts.method === 'GET') {
                    if (opts.headers && opts.headers.Authorization === 'Bearer fake-jwt-token') { 
                        let urlParts = url.split('/');
                        let id = parseInt(urlParts[urlParts.length - 1]);
                        let matchedUsers = users.filter(user => { return user.id === id; });
                        let user = matchedUsers.length ? matchedUsers[0] : null;
                        // resposta 200
                        resolve({ ok: true, text: () => JSON.stringify(user)});
                    } else {
                        // resposta 401
                        reject('Unauthorised');
                    }

                    return;
                }

                // registrar usuario
                if (url.endsWith('/users/register') && opts.method === 'POST') {
                    let newUser = JSON.parse(opts.body);

                    let duplicateUser = users.filter(user => { return user.username === newUser.username; }).length;
                    if (duplicateUser) {
                        reject('Usuário "' + newUser.username + '" já existe, tente novamente');
                        return;
                    }

                    newUser.id = users.length ? Math.max(...users.map(user => user.id)) + 1 : 1;
                    users.push(newUser);
                    localStorage.setItem('users', JSON.stringify(users));

                    resolve({ ok: true, text: () => Promise.resolve() });

                    return;
                }

                // deletar usuario
                if (url.match(/\/users\/\d+$/) && opts.method === 'DELETE') {
                  
                    if (opts.headers && opts.headers.Authorization === 'Bearer fake-jwt-token') {
                        let urlParts = url.split('/');
                        let id = parseInt(urlParts[urlParts.length - 1]);
                        for (let i = 0; i < users.length; i++) {
                            let user = users[i];
                            if (user.id === id) {
                                users.splice(i, 1);
                                localStorage.setItem('users', JSON.stringify(users));
                                break;
                            }
                        }

                        // resposta 200
                        resolve({ ok: true, text: () => Promise.resolve() });
                    } else {
                        reject('Unauthorised');
                    }

                    return;
                }
                realFetch(url, opts).then(response => resolve(response));

            }, 500);
        });
    }
}