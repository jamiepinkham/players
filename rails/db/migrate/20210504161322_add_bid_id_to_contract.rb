class AddBidIdToContract < ActiveRecord::Migration[5.0]
  def change
    add_reference :contracts, :bid, foreign_key: true
  end
end
