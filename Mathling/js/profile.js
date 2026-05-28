/* ============================================
   MATHLINGS — Profile Page Logic
   ============================================ */

const Profile = {
  init() {
    if (!App.requireAuth()) return;
    
    const user = App.state.currentUser;
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) {
      avatarEl.textContent = user.avatar || '\uD83D\uDC64';
    }
    
    this.setupEditModal();
  },

  setupEditModal() {
    const editBtn = document.getElementById('edit-profile-btn');
    const modal = document.getElementById('edit-profile-modal');
    const closeBtn = document.getElementById('edit-profile-close');
    const cancelBtn = document.getElementById('edit-profile-cancel');
    const saveBtn = document.getElementById('edit-profile-save');
    const nameInput = document.getElementById('edit-name-input');
    const avatarGrid = document.getElementById('avatar-grid');

    if (!editBtn || !modal) return;

    const avatars = ['🧑', '👩', '👨‍🏫', '🛡️', '😎', '🤖', '🦊', '🦉', '🐱', '🐶', '🦄', '🌟'];
    let selectedAvatar = App.state.currentUser.avatar || '🧑';

    const renderAvatars = () => {
      avatarGrid.innerHTML = avatars.map(a => `
        <div class="avatar-option" style="font-size:2.5rem; cursor:pointer; padding:5px; border-radius:50%; border:2px solid ${a === selectedAvatar ? 'var(--accent-blue)' : 'transparent'}; transition:all 0.2s;" data-avatar="${a}">
          ${a}
        </div>
      `).join('');

      avatarGrid.querySelectorAll('.avatar-option').forEach(el => {
        el.addEventListener('click', (e) => {
          selectedAvatar = e.currentTarget.dataset.avatar;
          renderAvatars();
        });
      });
    };

    const openModal = () => {
      nameInput.value = App.state.currentUser.name;
      selectedAvatar = App.state.currentUser.avatar || '🧑';
      renderAvatars();
      modal.classList.add('active');
    };

    const closeModal = () => modal.classList.remove('active');

    const saveChanges = async () => {
      const newName = nameInput.value.trim();
      if (!newName) {
        App.showToast('Name cannot be empty', 'error');
        return;
      }
      
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      
      try {
        const response = await fetch('Profile.aspx/UpdateProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, avatar: selectedAvatar })
        });
        const result = await response.json();
        
        if (result.d && result.d.success) {
          App.showToast('Profile updated successfully!', 'success');
          App.state.currentUser.name = newName;
          App.state.currentUser.avatar = selectedAvatar;
          localStorage.setItem('mathlings-user', JSON.stringify(App.state.currentUser));
          
          document.getElementById('MainContent_lblName').textContent = newName;
          document.getElementById('MainContent_profile-avatar').textContent = selectedAvatar;
          App.renderNav();
          closeModal();
        } else {
          App.showToast('Failed to update: ' + (result.d ? result.d.errorMessage : 'Unknown error'), 'error');
        }
      } catch (e) {
        console.error(e);
        App.showToast('Error saving profile', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    };

    editBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveChanges);
  }
};

document.addEventListener('DOMContentLoaded', () => Profile.init());
