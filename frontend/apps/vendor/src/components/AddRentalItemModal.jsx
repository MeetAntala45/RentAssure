import React from 'react';
import RentalItemFormModal from './RentalItemFormModal';

/**
 * Backward compatibility wrapper for AddRentalItemModal
 */
const AddRentalItemModal = ({ isOpen, onClose, onItemAdded }) => {
  return (
    <RentalItemFormModal
      isOpen={isOpen}
      onClose={onClose}
      itemToEdit={null}
      onItemSaved={(newItem) => {
        if (onItemAdded) onItemAdded(newItem);
      }}
    />
  );
};

export default AddRentalItemModal;
