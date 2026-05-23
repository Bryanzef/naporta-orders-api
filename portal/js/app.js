import {
  ApiError,
  authApi,
  clearSession,
  getToken,
  getUserEmail,
  ordersApi,
  setSession,
} from './api.js';

const STATUS_LABELS = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_TRANSIT: 'Em trânsito',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const state = {
  page: 1,
  limit: 10,
  editingId: null,
  filters: {},
};

const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const filtersForm = document.getElementById('filters-form');
const ordersTbody = document.getElementById('orders-tbody');
const ordersSummary = document.getElementById('orders-summary');
const paginationEl = document.getElementById('pagination');
const pageInfo = document.getElementById('page-info');
const orderDialog = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const itemsList = document.getElementById('items-list');
const statusField = document.getElementById('status-field');
const dialogTitle = document.getElementById('dialog-title');
const toast = document.getElementById('toast');

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDeliveryInput(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoDelivery(value) {
  return new Date(value).toISOString();
}

function showAuth() {
  authScreen.classList.remove('hidden');
  appScreen.classList.add('hidden');
}

function showApp() {
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  document.getElementById('user-email').textContent = getUserEmail() ?? '';
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  loginForm.classList.toggle('hidden', tab !== 'login');
  registerForm.classList.toggle('hidden', tab !== 'register');
}

function readFilters() {
  const data = new FormData(filtersForm);
  return {
    orderNumber: data.get('orderNumber')?.toString().trim() ?? '',
    status: data.get('status')?.toString() ?? '',
    startDate: data.get('startDate')?.toString() ?? '',
    endDate: data.get('endDate')?.toString() ?? '',
  };
}

function renderOrders(result) {
  const orders = result.data ?? [];
  const meta = result.meta ?? { total: 0, page: 1, totalPages: 1, hasNext: false, hasPrev: false };

  ordersSummary.textContent = `${meta.total} pedido(s) encontrado(s)`;

  if (orders.length === 0) {
    ordersTbody.innerHTML =
      '<tr><td colspan="6" class="empty">Nenhum pedido encontrado.</td></tr>';
  } else {
    ordersTbody.innerHTML = orders
      .map(
        (order) => `
      <tr>
        <td><strong>${order.orderNumber}</strong></td>
        <td>
          <div>${order.customerName}</div>
          <small style="color:#64748b">${order.customerDocument}</small>
        </td>
        <td>${formatDate(order.deliveryDate)}</td>
        <td><span class="badge badge-${order.status}">${STATUS_LABELS[order.status] ?? order.status}</span></td>
        <td>${formatDate(order.createdAt)}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-action="edit" data-id="${order.id}">Editar</button>
            <button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="${order.id}">Excluir</button>
          </div>
        </td>
      </tr>`,
      )
      .join('');
  }

  paginationEl.classList.toggle('hidden', meta.totalPages <= 1);
  pageInfo.textContent = `Página ${meta.page} de ${meta.totalPages}`;
  document.getElementById('prev-page').disabled = !meta.hasPrev;
  document.getElementById('next-page').disabled = !meta.hasNext;
}

async function loadOrders() {
  ordersTbody.innerHTML =
    '<tr><td colspan="6" class="empty">Carregando pedidos...</td></tr>';

  try {
    const result = await ordersApi.list({
      ...state.filters,
      page: state.page,
      limit: state.limit,
    });
    renderOrders(result);
  } catch (error) {
    ordersTbody.innerHTML =
      '<tr><td colspan="6" class="empty">Erro ao carregar pedidos.</td></tr>';
    showToast(error.message, 'error');
    if (error instanceof ApiError && error.status === 401) {
      clearSession();
      showAuth();
    }
  }
}

function createItemRow(item = { description: '', price: '', quantity: 1 }) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <label>
      Descrição
      <input type="text" name="itemDescription" required maxlength="255" value="${item.description ?? ''}" />
    </label>
    <label>
      Preço
      <input type="number" name="itemPrice" required min="0.01" step="0.01" value="${item.price ?? ''}" />
    </label>
    <label>
      Qtd
      <input type="number" name="itemQuantity" required min="1" step="1" value="${item.quantity ?? 1}" />
    </label>
    <button type="button" class="btn btn-ghost btn-sm remove-item">Remover</button>
  `;
  row.querySelector('.remove-item').addEventListener('click', () => {
    if (itemsList.children.length > 1) {
      row.remove();
    } else {
      showToast('O pedido precisa ter ao menos 1 item.', 'error');
    }
  });
  return row;
}

function resetItems(items = [{}]) {
  itemsList.innerHTML = '';
  items.forEach((item) => itemsList.appendChild(createItemRow(item)));
}

function readItemsFromForm() {
  return [...itemsList.querySelectorAll('.item-row')].map((row) => ({
    description: row.querySelector('[name="itemDescription"]').value.trim(),
    price: Number(row.querySelector('[name="itemPrice"]').value),
    quantity: Number(row.querySelector('[name="itemQuantity"]').value),
  }));
}

function readOrderForm() {
  const data = new FormData(orderForm);
  const body = {
    deliveryDate: toIsoDelivery(data.get('deliveryDate')),
    customerName: data.get('customerName').toString().trim(),
    customerDocument: data.get('customerDocument').toString().trim(),
    addressStreet: data.get('addressStreet').toString().trim(),
    addressNumber: data.get('addressNumber').toString().trim(),
    addressDistrict: data.get('addressDistrict').toString().trim(),
    addressCity: data.get('addressCity').toString().trim(),
    addressState: data.get('addressState').toString().trim().toUpperCase(),
    addressZipCode: data.get('addressZipCode').toString().trim(),
    items: readItemsFromForm(),
  };

  const complement = data.get('addressComplement')?.toString().trim();
  if (complement) body.addressComplement = complement;

  if (state.editingId) {
    body.status = data.get('status')?.toString();
  }

  return body;
}

function openCreateDialog() {
  state.editingId = null;
  dialogTitle.textContent = 'Novo pedido';
  statusField.classList.add('hidden');
  orderForm.reset();
  resetItems([{}]);
  orderForm.deliveryDate.value = formatDeliveryInput(
    new Date(Date.now() + 7 * 86_400_000),
  );
  orderDialog.showModal();
}

async function openEditDialog(id) {
  try {
    const order = await ordersApi.getById(id);
    state.editingId = id;
    dialogTitle.textContent = `Editar ${order.orderNumber}`;
    statusField.classList.remove('hidden');

    orderForm.deliveryDate.value = formatDeliveryInput(order.deliveryDate);
    orderForm.customerName.value = order.customerName;
    orderForm.customerDocument.value = order.customerDocument;
    orderForm.addressStreet.value = order.addressStreet;
    orderForm.addressNumber.value = order.addressNumber;
    orderForm.addressComplement.value = order.addressComplement ?? '';
    orderForm.addressDistrict.value = order.addressDistrict;
    orderForm.addressCity.value = order.addressCity;
    orderForm.addressState.value = order.addressState;
    orderForm.addressZipCode.value = order.addressZipCode;
    orderForm.status.value = order.status;

    resetItems(
      order.items.map((item) => ({
        description: item.description,
        price: Number(item.price),
        quantity: item.quantity,
      })),
    );

    orderDialog.showModal();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function saveOrder(event) {
  event.preventDefault();
  const body = readOrderForm();
  const saveBtn = document.getElementById('save-order-btn');
  saveBtn.disabled = true;

  try {
    if (state.editingId) {
      await ordersApi.update(state.editingId, body);
      showToast('Pedido atualizado com sucesso.');
    } else {
      await ordersApi.create(body);
      showToast('Pedido criado com sucesso.');
    }
    orderDialog.close();
    await loadOrders();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

async function deleteOrder(id) {
  if (!confirm('Deseja excluir este pedido? (exclusão lógica)')) return;

  try {
    await ordersApi.remove(id);
    showToast('Pedido excluído.');
    await loadOrders();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleAuthSubmit(event, mode) {
  event.preventDefault();
  const data = new FormData(event.target);

  try {
    let result;
    let email;

    if (mode === 'login') {
      email = data.get('email').toString();
      result = await authApi.login(email, data.get('password').toString());
    } else {
      email = data.get('email').toString();
      result = await authApi.register(
        data.get('name').toString(),
        email,
        data.get('password').toString(),
      );
    }

    setSession(result.accessToken, email);
    showApp();
    state.page = 1;
    await loadOrders();
    showToast(mode === 'login' ? 'Login realizado.' : 'Conta criada com sucesso.');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

loginForm.addEventListener('submit', (event) => handleAuthSubmit(event, 'login'));
registerForm.addEventListener('submit', (event) => handleAuthSubmit(event, 'register'));

document.getElementById('logout-btn').addEventListener('click', () => {
  clearSession();
  showAuth();
});

document.getElementById('new-order-btn').addEventListener('click', openCreateDialog);
document.getElementById('add-item-btn').addEventListener('click', () => {
  itemsList.appendChild(createItemRow());
});
document.getElementById('close-dialog').addEventListener('click', () => orderDialog.close());
document.getElementById('cancel-dialog').addEventListener('click', () => orderDialog.close());
orderForm.addEventListener('submit', saveOrder);

filtersForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  state.filters = readFilters();
  state.page = 1;
  await loadOrders();
});

document.getElementById('clear-filters-btn').addEventListener('click', async () => {
  filtersForm.reset();
  state.filters = {};
  state.page = 1;
  await loadOrders();
});

document.getElementById('prev-page').addEventListener('click', async () => {
  if (state.page > 1) {
    state.page -= 1;
    await loadOrders();
  }
});

document.getElementById('next-page').addEventListener('click', async () => {
  state.page += 1;
  await loadOrders();
});

ordersTbody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === 'edit') await openEditDialog(id);
  if (action === 'delete') await deleteOrder(id);
});

if (getToken()) {
  showApp();
  loadOrders();
} else {
  showAuth();
}
