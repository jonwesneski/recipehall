import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClientKnownRequestError } from '@repo/database';
import {
  PrismaQueryParams,
  PrismaResults,
  PrismaService,
} from '../../services/prisma.service';
import { BookmarkOwnerError } from './exceptions';
import {
  PublicRecipesSearch,
  type RecipeCreateType,
  RecipeInclude,
  RecipeMinimalPrismaInclude,
  type RecipeMinimalPrismaType,
  type RecipeMinimalType,
  type RecipePrismaType,
  type RecipeType,
  type RecipeUpdateType,
} from './types';

export type GetRecipesQueryParams = PrismaQueryParams & {
  where: Prisma.RecipeWhereInput;
};

export type GetPublicRecipesQueryParams = PrismaQueryParams & {
  where: PublicRecipesSearch;
};

@Injectable()
export class RecipeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getRecipes(
    params: GetRecipesQueryParams,
  ): Promise<PrismaResults<RecipeMinimalType[]>> {
    const recipes = await this.prisma.recipe.findMany({
      where: params.where,
      cursor: params.cursorId ? { id: params.cursorId } : undefined,
      skip: params.cursorId ? 1 : params.skip,
      take: params.take,
      ...RecipeMinimalPrismaInclude,
    });
    return {
      data: recipes.map((recipe) => this.transformRecipeMinimal(recipe)),
      pagination: {
        totalRecords: await this.prisma.recipe.count({
          where: { isPublic: true, userId: params.where.userId },
        }),
        currentCursor:
          recipes.length > 0 ? recipes[0].id : params.cursorId || null,
        nextCursor: recipes.length > 0 ? recipes[recipes.length - 1].id : null,
      },
    };
  }

  async getPublicRecipes(
    params: GetPublicRecipesQueryParams,
  ): Promise<PrismaResults<RecipeMinimalType[]>> {
    // const { diets, proteins, ...rest } = params;
    const recipes = await this.prisma.recipe.findMany({
      where: {
        ...params.where,
        isPublic: true,
      },
      cursor: params.cursorId ? { id: params.cursorId } : undefined,
      skip: params.cursorId ? 1 : params.skip,
      take: params.take,
      ...RecipeMinimalPrismaInclude,
      include: {
        ...RecipeMinimalPrismaInclude.include,
        _count: {
          select: {
            bookmarkedBy: {
              where: { userId: params.where.userId as string | undefined },
            },
          },
        },
      },
    });
    return {
      data: recipes.map((recipe) => this.transformRecipeMinimal(recipe)),
      pagination: {
        totalRecords: await this.prisma.recipe.count({
          where: { isPublic: true, userId: params.where.userId },
        }),
        currentCursor:
          recipes.length > 0 ? recipes[0].id : params.cursorId || null,
        nextCursor: recipes.length > 0 ? recipes[recipes.length - 1].id : null,
      },
    };
  }

  private transformRecipeMinimal(
    recipe: RecipeMinimalPrismaType,
    requestedUserId?: string,
  ): RecipeMinimalType {
    const { recipeTags, _count, ...rest } = recipe;
    let bookmarked: boolean | undefined = undefined;
    if (requestedUserId && requestedUserId !== recipe.user.id) {
      bookmarked = _count.bookmarkedBy > 0;
    }
    return {
      ...rest,
      tags: recipeTags.map((rt) => rt.tag.name),
      bookmarked,
    };
  }

  async getPublicRecipe(
    id: string,
    requestedUserId?: string,
  ): Promise<RecipeType> {
    const recipe = await this.prisma.recipe.findFirstOrThrow({
      where: {
        id,
        OR: [{ isPublic: true }, { userId: requestedUserId }],
      },
      include: {
        ...RecipeInclude.include,
        user: {
          select: {
            ...RecipeInclude.include.user.select,
            _count: {
              select: { followers: { where: { userId: requestedUserId } } },
            },
          },
        },
      },
      omit: {
        ...RecipeInclude.omit,
      },
    });

    const { user, ...restRecipe } = recipe;
    const { _count, ...restUser } = user;
    const transformedRecipe = this.transformRecipe({
      ...restRecipe,
      user: restUser,
    });
    const amIFollowing: boolean | undefined =
      requestedUserId && requestedUserId !== recipe.user.id
        ? _count.followers > 0
        : undefined;
    transformedRecipe.user.amIFollowing = amIFollowing;
    return transformedRecipe;
  }

  async getRecipe(id: string, userId: string): Promise<RecipeType> {
    const recipe = await this.prisma.recipe.findFirstOrThrow({
      where: {
        id,
        userId,
      },
      ...RecipeInclude,
    });
    return this.transformRecipe(recipe);
  }

  private transformRecipe(
    recipe: RecipePrismaType,
    requestedUserId?: string,
  ): RecipeType {
    const { recipeTags, equipments, isPublic, _count, ...rest } = recipe;
    let bookmarked: boolean | undefined = undefined;
    if (requestedUserId && requestedUserId !== recipe.user.id) {
      bookmarked = _count.bookmarkedBy > 0;
    }

    let isRecipePublic: boolean | undefined = undefined;
    if (requestedUserId && requestedUserId === recipe.user.id) {
      isRecipePublic = isPublic;
    }

    return {
      ...rest,
      isPublic: isRecipePublic,
      equipments: equipments.map((e) => e.name),
      tags: recipeTags.map((rt) => rt.tag.name),
      bookmarked,
    };
  }

  async createRecipe(
    userId: string,
    data: RecipeCreateType,
  ): Promise<RecipeType> {
    const { tags, ...remainingData } = data;

    const recipe = await this.prisma.recipe.create({
      data: {
        ...remainingData,
        userId,
        imageUrl: undefined,
        steps: {
          create: data.steps.map((step, i) => ({
            displayOrder: i,
            instruction: step.instruction,
            ingredients: {
              createMany: {
                data:
                  step.ingredients.map((ingredient, k) => {
                    return {
                      displayOrder: k,
                      amount: ingredient.amount,
                      unit: ingredient.unit,
                      name: ingredient.name,
                    };
                  }) || [],
              },
            },
            imageUrl: undefined,
          })),
        },
        nutritionalFacts: {
          create: data.nutritionalFacts || {},
        },
        recipeTags: {
          create: tags.map((tag) => ({
            tag: {
              connectOrCreate: {
                where: { name: tag },
                create: { name: tag },
              },
            },
          })),
        },
        equipments: {
          connectOrCreate: data.equipments.map((equipment) => ({
            where: { name: equipment },
            create: { name: equipment },
          })),
        },
      },
      ...RecipeInclude,
    });

    return this.transformRecipe(recipe);
  }

  async updateRecipe(
    userId: string,
    id: string,
    data: RecipeUpdateType,
  ): Promise<{ recipe: RecipeType; deletedStepImageUrls: string[] }> {
    const { tags, steps, equipments, nutritionalFacts, ...scalarData } = data;

    return await this.prisma.$transaction(async (tx) => {
      let deletedStepImageUrls: string[] = [];
      let stepsWriteData:
        | {
            deleteMany?: { id: { in: string[] } };
            upsert?: object[];
          }
        | undefined = undefined;

      if (steps !== undefined) {
        const removeIds = steps.remove ?? [];
        const updateSteps = steps.update ?? [];
        const addSteps = steps.add ?? [];

        // Collect image URLs for steps being removed
        if (removeIds.length > 0) {
          const stepsToDelete = await tx.step.findMany({
            where: { recipeId: id, id: { in: removeIds } },
            select: { imageUrl: true },
          });
          deletedStepImageUrls = stepsToDelete
            .map((s) => s.imageUrl)
            .filter((url): url is string => url !== null);
        }

        // Move update steps to negative displayOrders to avoid same-request
        // conflicts (e.g. swapping two steps' positions). Untouched steps keep
        // their positions — conflicts with them are the caller's responsibility.
        if (updateSteps.length > 0) {
          await Promise.all(
            updateSteps.map((s, i) =>
              tx.step.update({
                where: { id: s.id },
                data: { displayOrder: -(i + 1) },
              }),
            ),
          );
        }

        // Same negative trick for ingredient updates within each updated step.
        for (const s of updateSteps) {
          if (!s.ingredients?.update?.length) continue;
          await Promise.all(
            s.ingredients.update.map((ing, k) =>
              tx.ingredient.update({
                where: { id: ing.id },
                data: { displayOrder: -(k + 1) },
              }),
            ),
          );
        }

        stepsWriteData = {
          ...(removeIds.length > 0
            ? { deleteMany: { id: { in: removeIds } } }
            : {}),
          ...(updateSteps.length > 0 || addSteps.length > 0
            ? {
                upsert: [...updateSteps, ...addSteps].map((s) => {
                  const isUpdate = 'id' in s;
                  return {
                    where: { id: isUpdate ? s.id : '' },
                    update: {
                      displayOrder: s.displayOrder,
                      ...(s.instruction !== undefined
                        ? { instruction: s.instruction }
                        : {}),
                      ...(!isUpdate || s.ingredients === undefined
                        ? {}
                        : {
                            ingredients: this.buildIngredientOps(s.ingredients),
                          }),
                    },
                    create: {
                      displayOrder: s.displayOrder,
                      instruction: s.instruction ?? null,
                      ...(isUpdate
                        ? {}
                        : {
                            ingredients: {
                              createMany: {
                                data: (s.ingredients ?? []).map((ing) => ({
                                  displayOrder: ing.displayOrder,
                                  amount: ing.amount,
                                  unit: ing.unit,
                                  name: ing.name,
                                  isFraction: ing.isFraction,
                                })),
                              },
                            },
                          }),
                    },
                  };
                }),
              }
            : {}),
        };
      }

      const recipe = (await tx.recipe.update({
        where: { id, user: { id: userId } },
        data: {
          ...scalarData,
          ...(stepsWriteData !== undefined
            ? { steps: stepsWriteData as any }
            : {}),
          ...(equipments !== undefined
            ? {
                equipments: {
                  deleteMany: { name: { notIn: equipments } },
                  connectOrCreate: equipments.map((name) => ({
                    where: { name },
                    create: { name },
                  })),
                },
              }
            : {}),
          ...(nutritionalFacts !== undefined && nutritionalFacts !== null
            ? { nutritionalFacts: { update: nutritionalFacts } }
            : {}),
          ...(tags !== undefined
            ? {
                recipeTags: {
                  deleteMany: {},
                  create: tags.map((tag) => ({
                    tag: {
                      connectOrCreate: {
                        where: { name: tag },
                        create: { name: tag },
                      },
                    },
                  })),
                },
              }
            : {}),
        },
        ...RecipeInclude,
      })) as unknown as RecipePrismaType;

      return { recipe: this.transformRecipe(recipe), deletedStepImageUrls };
    });
  }

  private buildIngredientOps(ingredients: {
    add?: {
      displayOrder: number;
      amount: number;
      isFraction: boolean;
      unit: string | null;
      name: string;
    }[];
    update?: {
      id: string;
      displayOrder: number;
      amount: number;
      isFraction: boolean;
      unit: string | null;
      name: string;
    }[];
    remove?: string[];
  }) {
    return {
      ...(ingredients.remove?.length
        ? { deleteMany: { id: { in: ingredients.remove } } }
        : {}),
      ...(ingredients.update?.length
        ? {
            upsert: ingredients.update.map((ing) => ({
              where: { id: ing.id },
              update: {
                displayOrder: ing.displayOrder,
                amount: ing.amount,
                unit: ing.unit,
                name: ing.name,
                isFraction: ing.isFraction,
              },
              create: {
                displayOrder: ing.displayOrder,
                amount: ing.amount,
                unit: ing.unit,
                name: ing.name,
                isFraction: ing.isFraction,
              },
            })),
          }
        : {}),
      ...(ingredients.add?.length
        ? {
            createMany: {
              data: ingredients.add.map((ing) => ({
                displayOrder: ing.displayOrder,
                amount: ing.amount,
                unit: ing.unit,
                name: ing.name,
                isFraction: ing.isFraction,
              })),
            },
          }
        : {}),
    };
  }

  async addImageToRecipe(id: string, imageUrl: string) {
    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: { imageUrl },
      ...RecipeInclude,
    });

    return this.transformRecipe(recipe);
  }

  async addImageToRecipeStep(id: string, imageUrl: string) {
    await this.prisma.step.update({
      where: { id },
      data: { imageUrl },
    });
  }

  async delete(id: string, userId: string) {
    await this.prisma.recipe.delete({
      where: { id, userId },
    });
  }

  async bookmark(recipeId: string, userId: string, bookmark: boolean) {
    if (bookmark) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: recipeId, userId },
      });
      if (recipe) {
        throw new BookmarkOwnerError();
      }

      await this.prisma.recipeBookmark.createMany({
        data: { userId, recipeId },
        skipDuplicates: true, // Ignoring if it already exists
      });
    } else {
      try {
        await this.prisma.recipeBookmark.delete({
          where: {
            userId_recipeId: { userId, recipeId },
          },
        });
      } catch (error) {
        if (
          !(error instanceof PrismaClientKnownRequestError) ||
          error.code !== 'P2025'
        ) {
          throw error;
        }
        // Ignoring if it doesn't exist
      }
    }
  }
}
