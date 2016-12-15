/* Used in the retargetted design evaluation study*/
var Modal = function(child, strictClose) {
    this.child = child;
    this.portal = false;

    //strictClose can be passed in as true to enforce
        //only close on clicking 'X' ** Must have font awesome or change
        //closeModal.className in render method to other svg font icon class
    this.strictClose = strictClose;
};


Modal.prototype.show = function() {
    if (!this.portal) {
        this.portal = document.createElement('div');
        this.portal.className = 'modal fade';
        var backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.addEventListener('click', this.hide.bind(this));
        this.portal.appendChild(backdrop);
        document.body.insertBefore(this.portal, document.body.children[0]);
        this.render();
    }
};


Modal.prototype.render = function() {
    if (this.portal) {
        setTimeout(function() {
            this.portal.classList.add('in');
        }.bind(this), 10);
        var inner = document.createElement('div');
            inner.className = 'modal-inner';
        var closeModal = document.createElement('div');
            closeModal.id = 'close-modal';
            closeModal.className = 'fa fa-times';
        inner.appendChild(closeModal);
        inner.appendChild(this.child);
        this.portal.children[0].appendChild(inner);
    }
};

Modal.prototype.settleOnMount = function() {
    if (this.portal) {
        this.portal.classList.add('in');
    }
};

Modal.prototype.hide = function(e) {
    if (e.target.className === 'modal-backdrop' && !this.strictClose) {
        this.unmount();
    }
    if (e.target.id === 'close-modal') {
        this.unmount();
    }
};

Modal.prototype.unmount = function() {
    if (this.portal) {
        document.body.removeChild(this.portal);
        this.portal = false;
    }
};
