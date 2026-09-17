"""stay coordinates, room options, reviews and stay requests"""
from alembic import op
import sqlalchemy as sa

revision = "0002_stay_rooms_requests"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("stays", sa.Column("latitude", sa.Float))
    op.add_column("stays", sa.Column("longitude", sa.Float))
    op.add_column("stays", sa.Column("room_options", sa.JSON))
    op.add_column("stays", sa.Column("reviews", sa.JSON))
    op.create_table(
        "stay_requests",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stay_id", sa.String(100), sa.ForeignKey("stays.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hospital_id", sa.String(80), sa.ForeignKey("hospitals.id")),
        sa.Column("room_type", sa.String(80), nullable=False),
        sa.Column("check_in", sa.Date, nullable=False),
        sa.Column("nights", sa.Integer, nullable=False),
        sa.Column("guests", sa.Integer, nullable=False),
        sa.Column("include_food", sa.Boolean, server_default=sa.true()),
        sa.Column("contact_name", sa.String(120), nullable=False),
        sa.Column("contact_phone", sa.String(30), nullable=False),
        sa.Column("notes", sa.Text),
        sa.Column("estimated_cost", sa.Integer, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_stay_requests_user_id", "stay_requests", ["user_id"])
    op.create_index("ix_stay_requests_stay_id", "stay_requests", ["stay_id"])


def downgrade():
    op.drop_index("ix_stay_requests_stay_id", "stay_requests")
    op.drop_index("ix_stay_requests_user_id", "stay_requests")
    op.drop_table("stay_requests")
    with op.batch_alter_table("stays") as batch:
        batch.drop_column("reviews")
        batch.drop_column("room_options")
        batch.drop_column("longitude")
        batch.drop_column("latitude")
