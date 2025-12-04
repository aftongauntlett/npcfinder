/**
 * Grocery Item Modal
 *
 * Quick, simple modal for adding/editing grocery items
 * No priority, no due dates - just name, category, and quantity
 */

import React, { useState, useEffect } from "react";
import Modal from "../shared/ui/Modal";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import Select from "../shared/ui/Select";
import Button from "../shared/ui/Button";
import { GROCERY_CATEGORIES } from "../../utils/taskConstants";
import type { Task } from "../../services/tasksService.types";

interface GroceryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  item?: Task | null;
  onSubmit: (data: {
    title: string;
    item_data: {
      item_name: string;
      category: string;
      quantity: string;
      notes?: string;
    };
  }) => void;
}

const GroceryItemModal: React.FC<GroceryItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
}) => {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Other");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        const itemData = item.item_data as
          | { category?: string; quantity?: string; notes?: string }
          | null
          | undefined;
        setItemName(item.title || "");
        setCategory(itemData?.category || "Other");
        setQuantity(itemData?.quantity || "");
        setNotes(itemData?.notes || "");
      } else {
        setItemName("");
        setCategory("Other");
        setQuantity("");
        setNotes("");
      }
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: itemName.trim(),
        item_data: {
          item_name: itemName.trim(),
          category,
          quantity: quantity.trim(),
          notes: notes.trim() || undefined,
        },
      });

      onClose();
    } catch (error) {
      console.error("Failed to save grocery item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={item ? "Edit Grocery Item" : "Add Grocery Item"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Item Name */}
        <Input
          id="item-name"
          label="Item Name"
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Milk, eggs, bread..."
          required
          autoFocus
          disabled={isSubmitting}
        />

        {/* Category */}
        <Select
          id="item-category"
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          disabled={isSubmitting}
        >
          {GROCERY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>

        {/* Quantity */}
        <Input
          id="item-quantity"
          label="Quantity (optional)"
          type="text"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="2 lbs, 1 gallon, 3 items..."
          disabled={isSubmitting}
        />

        {/* Notes */}
        <Textarea
          id="item-notes"
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Brand preference, coupon info..."
          disabled={isSubmitting}
          rows={2}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !itemName.trim()}
            className="flex-1"
          >
            {isSubmitting ? "Saving..." : item ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GroceryItemModal;
