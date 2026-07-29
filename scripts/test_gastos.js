(async () => {
  const base = 'http://localhost:3000';
  const creds = { email: 'test@example.com', senha: 'senha123' };

  const opts = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  let token;

  try {
    let r = await fetch(base + '/auth/login', opts(creds));
    let j = await r.json();
    if (!r.ok) throw j;
    token = j.token;
  } catch (e) {
    console.log('Login falhou, registrando usuário de teste...', e.error || e);
    await fetch(base + '/auth/register', opts({ nome: 'Teste', ...creds }));
    let r2 = await fetch(base + '/auth/login', opts(creds));
    let j2 = await r2.json();
    token = j2.token;
  }

  console.log('Token obtido:', token);

  const totalRes = await fetch(base + '/gastos/total', { headers: { Authorization: 'Bearer ' + token } });
  console.log('/gastos/total status:', totalRes.status);
  const totalBody = await totalRes.text();
  console.log('/gastos/total body:', totalBody);

  const listRes = await fetch(base + '/gastos?tipo=DESPESA', { headers: { Authorization: 'Bearer ' + token } });
  console.log('/gastos?tipo=DESPESA status:', listRes.status);
  const listBody = await listRes.text();
  console.log('/gastos?tipo=DESPESA body:', listBody);

})().catch(err => {
  console.error('Erro no script:', err);
});